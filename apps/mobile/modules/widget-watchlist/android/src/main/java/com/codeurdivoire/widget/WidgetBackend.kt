package com.codeurdivoire.widget

import android.content.Context
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

object WidgetBackend {

  private const val TAG = "WidgetBackend"
  private const val PATH_RATES = "/rates"
  private const val TIMEOUT_SECONDS = 10L

  // Single shared client — pools connections across rate + history fetches.
  private val client: OkHttpClient by lazy {
    OkHttpClient.Builder()
      .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
      .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
      .callTimeout(TIMEOUT_SECONDS * 2, TimeUnit.SECONDS)
      .build()
  }

  enum class ErrorKind { NONE, CONFIG, NETWORK, HTTP_4XX, HTTP_429, HTTP_5XX, PARSE, PARTIAL }

  data class RefreshOutcome(
    val pairs: List<PairData>,
    val error: ErrorKind,
  )

  data class Config(val baseUrl: String, val apiKey: String)

  private sealed class FetchOutcome<T> {
    data class Ok<T>(val data: T) : FetchOutcome<T>()
    data class HttpError<T>(val code: Int) : FetchOutcome<T>()
    data class NetworkError<T>(val exception: Exception) : FetchOutcome<T>()
    data class ParseError<T>(val exception: Exception) : FetchOutcome<T>()
  }

  private fun readConfig(context: Context): Config {
    val ai = context.packageManager.getApplicationInfo(
      context.packageName,
      android.content.pm.PackageManager.GET_META_DATA
    )
    val baseUrl = ai.metaData?.getString("widget.api.baseUrl") ?: ""
    val apiKey = ai.metaData?.getString("widget.api.key") ?: ""
    return Config(baseUrl.trimEnd('/'), apiKey)
  }

  suspend fun refresh(context: Context, pairs: List<PairData>): RefreshOutcome = withContext(Dispatchers.IO) {
    val cfg = readConfig(context)
    val period = WidgetDataStore.readPeriod(context)
    Log.d(TAG, "refresh: baseUrl='${cfg.baseUrl}' apiKey.len=${cfg.apiKey.length} period=$period")
    if (cfg.baseUrl.isBlank() || cfg.apiKey.isBlank()) {
      Log.w(TAG, "refresh: missing baseUrl or apiKey in manifest meta-data")
      return@withContext RefreshOutcome(pairs, ErrorKind.CONFIG)
    }

    val bases = pairs.map { it.from }.distinct()
    val rateOutcomes = coroutineScope {
      bases.map { base -> async { base to fetchRates(cfg, base) } }.awaitAll()
    }
    val rateCache = mutableMapOf<String, Map<String, Double>>()
    val baseErrors = mutableListOf<ErrorKind>()
    rateOutcomes.forEach { (base, outcome) ->
      when (outcome) {
        is FetchOutcome.Ok -> {
          rateCache[base] = outcome.data
          Log.d(TAG, "refresh: fetched ${outcome.data.size} rates for base=$base")
        }
        is FetchOutcome.HttpError -> {
          baseErrors += httpErrorKind(outcome.code)
          rateCache[base] = emptyMap()
        }
        is FetchOutcome.ParseError -> {
          baseErrors += ErrorKind.PARSE
          rateCache[base] = emptyMap()
        }
        is FetchOutcome.NetworkError -> {
          baseErrors += ErrorKind.NETWORK
          rateCache[base] = emptyMap()
        }
      }
    }

    val historyOutcomes = coroutineScope {
      pairs.map { p -> async { fetchHistory(cfg, p.from, p.to, period) } }.awaitAll()
    }

    val pairErrors = mutableListOf<ErrorKind>()
    val refreshed = pairs.mapIndexed { idx, p ->
      val current = rateCache[p.from]?.get(p.to)
      val historyOutcome = historyOutcomes[idx]
      val history = when (historyOutcome) {
        is FetchOutcome.Ok -> historyOutcome.data
        is FetchOutcome.HttpError -> {
          pairErrors += httpErrorKind(historyOutcome.code)
          emptyList()
        }
        is FetchOutcome.ParseError -> {
          pairErrors += ErrorKind.PARSE
          emptyList()
        }
        is FetchOutcome.NetworkError -> {
          pairErrors += ErrorKind.NETWORK
          emptyList()
        }
      }
      val historyOk = historyOutcome is FetchOutcome.Ok
      val last = history.lastOrNull()
      val first = history.firstOrNull()
      val variation = if (last != null && first != null && first != 0.0 && history.size >= 2) {
        ((last - first) / first) * 100.0
      } else null
      Log.d(TAG, "refresh: pair=${p.from}/${p.to} current=$current history.size=${history.size} historyOk=$historyOk")
      // On history failure keep the OLD variation together with the OLD
      // sparkline: a dash next to a stale sparkline would lie about the data.
      p.copy(
        rate = current ?: p.rate,
        variationPct = if (historyOk) variation else p.variationPct,
        sparklinePoints = if (historyOk) history else p.sparklinePoints
      )
    }

    // Fresh = this round actually delivered both the rate AND the history.
    // Carried-over stale data must not silence retries or fake analytics.
    val freshCount = pairs.indices.count { i ->
      rateCache[pairs[i].from]?.get(pairs[i].to) != null && historyOutcomes[i] is FetchOutcome.Ok
    }
    val totalCount = pairs.size
    val allErrors = baseErrors + pairErrors
    val worstError = pickWorstError(allErrors)

    val error = when {
      freshCount == totalCount -> ErrorKind.NONE
      freshCount == 0 -> worstError
      else -> ErrorKind.PARTIAL
    }
    Log.d(TAG, "refresh: fresh=$freshCount/$totalCount error=$error worstUpstream=$worstError")
    RefreshOutcome(refreshed, error)
  }

  // 429 is rate limiting, not a permanent client error: it must stay below the
  // terminal 4xx/parse kinds (a real 4xx in the mix still wins and stops us) but
  // remains retryable alongside 5xx/network.
  private fun httpErrorKind(code: Int): ErrorKind = when {
    code == 429 -> ErrorKind.HTTP_429
    code in 400..499 -> ErrorKind.HTTP_4XX
    else -> ErrorKind.HTTP_5XX
  }

  private fun pickWorstError(errors: List<ErrorKind>): ErrorKind {
    if (errors.isEmpty()) return ErrorKind.NETWORK
    val priority = listOf(
      ErrorKind.HTTP_4XX,
      ErrorKind.PARSE,
      ErrorKind.HTTP_5XX,
      ErrorKind.HTTP_429,
      ErrorKind.NETWORK,
    )
    return priority.firstOrNull { it in errors } ?: ErrorKind.NETWORK
  }

  private fun fetchRates(cfg: Config, base: String): FetchOutcome<Map<String, Double>> {
    val url = "${cfg.baseUrl}$PATH_RATES/$base"
    Log.d(TAG, "fetchRates: GET $url")
    return executeJson(url, cfg.apiKey, "fetchRates[$base]") { body ->
      val json = JSONObject(body).getJSONObject("rates")
      json.keys().asSequence().associateWith { k -> json.getDouble(k) }
    }
  }

  private fun fetchHistory(cfg: Config, base: String, target: String, days: Int): FetchOutcome<List<Double>> {
    val url = "${cfg.baseUrl}$PATH_RATES/$base/history?target=$target&days=$days"
    Log.d(TAG, "fetchHistory: GET $url")
    return executeJson(url, cfg.apiKey, "fetchHistory[$base/$target]") { body ->
      val arr = JSONObject(body).getJSONArray("rates")
      (0 until arr.length()).map { i -> arr.getJSONObject(i).getDouble("rate") }
    }
  }

  private inline fun <T> executeJson(
    url: String,
    apiKey: String,
    tag: String,
    parse: (String) -> T,
  ): FetchOutcome<T> {
    val request = Request.Builder()
      .url(url)
      .header("x-api-key", apiKey)
      .get()
      .build()
    return try {
      client.newCall(request).execute().use { response ->
        val code = response.code
        Log.d(TAG, "$tag: response code=$code")
        if (response.isSuccessful) {
          val body = response.body?.string().orEmpty()
          try {
            FetchOutcome.Ok(parse(body))
          } catch (e: JSONException) {
            Log.e(TAG, "$tag: parse error", e)
            FetchOutcome.ParseError(e)
          }
        } else {
          val errBody = response.body?.string().orEmpty()
          Log.w(TAG, "$tag: non-2xx code=$code body=$errBody")
          FetchOutcome.HttpError(code)
        }
      }
    } catch (e: IOException) {
      Log.e(TAG, "$tag: network exception", e)
      FetchOutcome.NetworkError(e)
    } catch (e: JSONException) {
      Log.e(TAG, "$tag: parse exception", e)
      FetchOutcome.ParseError(e)
    }
  }
}
