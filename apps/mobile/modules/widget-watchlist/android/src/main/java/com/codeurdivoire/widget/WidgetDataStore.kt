package com.codeurdivoire.widget

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.first
import org.json.JSONArray
import org.json.JSONObject

internal val Context.widgetDataStore by preferencesDataStore(name = "widget_watchlist")

object WidgetKeys {
  val PAIRS_JSON = stringPreferencesKey("pairs_json")
  val IS_PRO = booleanPreferencesKey("is_pro")
  val EXPIRES_AT = longPreferencesKey("expires_at")
  val GRACE_PERIOD_MS = longPreferencesKey("grace_period_ms")
  val IS_OFFLINE = booleanPreferencesKey("is_offline")
  val LAST_SUCCESS_AT = longPreferencesKey("last_success_at")
  val REFRESHING_STARTED_AT = longPreferencesKey("refreshing_started_at")
  val DECIMALS = intPreferencesKey("decimals")
  val WIDGET_PERIOD = intPreferencesKey("widget_period")
  val STRING_WATCHLIST_TITLE = stringPreferencesKey("s_watchlist_title")
  val STRING_UPDATED_AT = stringPreferencesKey("s_updated_at")
  val STRING_OFFLINE = stringPreferencesKey("s_offline")
  val STRING_EMPTY_STATE = stringPreferencesKey("s_empty_state")
  val STRING_LOCKED_HEADLINE = stringPreferencesKey("s_locked_headline")
  val STRING_LOCKED_TAGLINE = stringPreferencesKey("s_locked_tagline")
  val STRING_LOCKED_CTA = stringPreferencesKey("s_locked_cta")
  val STRING_REFRESHING = stringPreferencesKey("s_refreshing")
  val STRING_UP_TO_DATE = stringPreferencesKey("s_up_to_date")
}

// `variationPct` is the percentage variation over the user-configured
// period (7d / 1m / 3m / 9m / 1y).
data class PairData(
  val from: String,
  val to: String,
  val rate: Double,
  val variationPct: Double?,
  val sparklinePoints: List<Double>
)

data class WidgetStringsSnapshot(
  val watchlistTitle: String,
  val updatedAt: String,
  val offline: String,
  val emptyState: String,
  val lockedHeadline: String,
  val lockedTagline: String,
  val lockedCta: String,
  val refreshing: String,
  val upToDate: String
) {
  companion object {
    fun default() = WidgetStringsSnapshot(
      watchlistTitle = "Watchlist",
      updatedAt = "Updated {time}",
      offline = "Offline",
      emptyState = "Open the app to configure",
      lockedHeadline = "Watchlist Pro",
      lockedTagline = "Your favorite rates, without opening the app.",
      lockedCta = "Unlock Pro",
      refreshing = "Refreshing…",
      upToDate = "Up to date"
    )
  }
}

object WidgetDataStore {
  internal fun buildPairsJson(pairs: List<Map<String, Any?>>): String {
    val arr = JSONArray()
    pairs.forEach { p ->
      val obj = JSONObject()
      obj.put("from", p["from"])
      obj.put("to", p["to"])
      obj.put("rate", (p["rate"] as? Number)?.toDouble() ?: 0.0)
      val variation = p["variationPct"]
      if (variation is Number) obj.put("variationPct", variation.toDouble())
      else obj.put("variationPct", JSONObject.NULL)
      val points = JSONArray()
      (p["sparklinePoints"] as? List<*>)?.forEach { points.put((it as Number).toDouble()) }
      obj.put("sparklinePoints", points)
      arr.put(obj)
    }
    return arr.toString()
  }

  suspend fun writePairs(context: Context, pairs: List<Map<String, Any?>>) {
    val json = buildPairsJson(pairs)
    context.widgetDataStore.edit { it[WidgetKeys.PAIRS_JSON] = json }
  }

  suspend fun readPairs(context: Context): List<PairData> {
    val raw = context.widgetDataStore.data.first()[WidgetKeys.PAIRS_JSON] ?: return emptyList()
    return try {
      parsePairs(raw)
    } catch (e: Exception) {
      Log.e("WidgetDataStore", "readPairs: corrupt pairs_json, clearing", e)
      context.widgetDataStore.edit { it.remove(WidgetKeys.PAIRS_JSON) }
      emptyList()
    }
  }

  // The store's current keys are the source of truth (the user may have
  // edited the watchlist while the worker was fetching): refreshed data only
  // updates pairs still present, never resurrects removed ones or drops
  // freshly added ones. Runs entirely inside the edit transaction.
  suspend fun mergeRefreshedPairs(context: Context, refreshed: List<PairData>) {
    context.widgetDataStore.edit { prefs ->
      val currentRaw = prefs[WidgetKeys.PAIRS_JSON] ?: return@edit
      val current = try {
        parsePairs(currentRaw)
      } catch (e: Exception) {
        Log.e("WidgetDataStore", "mergeRefreshedPairs: corrupt pairs_json, skipping merge", e)
        return@edit
      }
      val refreshedByKey = refreshed.associateBy { "${it.from}/${it.to}" }
      val merged = current.map { p -> refreshedByKey["${p.from}/${p.to}"] ?: p }
      prefs[WidgetKeys.PAIRS_JSON] = buildPairsJson(merged.map { it.toMap() })
    }
  }

  internal fun parsePairs(raw: String): List<PairData> {
    val arr = JSONArray(raw)
    return (0 until arr.length()).map { i ->
      val obj = arr.getJSONObject(i)
      val points = obj.getJSONArray("sparklinePoints")
      PairData(
        from = obj.getString("from"),
        to = obj.getString("to"),
        rate = obj.getDouble("rate"),
        variationPct = if (obj.isNull("variationPct")) null else obj.getDouble("variationPct"),
        sparklinePoints = (0 until points.length()).map { points.getDouble(it) }
      )
    }
  }

  suspend fun setProState(context: Context, isPro: Boolean) {
    context.widgetDataStore.edit { it[WidgetKeys.IS_PRO] = isPro }
  }

  suspend fun readIsPro(context: Context): Boolean {
    return context.widgetDataStore.data.first()[WidgetKeys.IS_PRO] ?: false
  }

  suspend fun setSubscriptionExpiry(context: Context, expiresAtMs: Long?, gracePeriodMs: Long) {
    context.widgetDataStore.edit { prefs ->
      if (expiresAtMs == null) {
        prefs.remove(WidgetKeys.EXPIRES_AT)
      } else {
        prefs[WidgetKeys.EXPIRES_AT] = expiresAtMs
      }
      prefs[WidgetKeys.GRACE_PERIOD_MS] = gracePeriodMs.coerceAtLeast(0L)
    }
  }

  suspend fun readSubscriptionExpiry(context: Context): Pair<Long?, Long> {
    val prefs = context.widgetDataStore.data.first()
    return prefs[WidgetKeys.EXPIRES_AT] to (prefs[WidgetKeys.GRACE_PERIOD_MS] ?: 0L)
  }

  suspend fun isProEffective(context: Context, nowMs: Long): Boolean {
    val prefs = context.widgetDataStore.data.first()
    val isPro = prefs[WidgetKeys.IS_PRO] ?: false
    if (!isPro) return false
    val expiresAt = prefs[WidgetKeys.EXPIRES_AT] ?: return true
    val grace = prefs[WidgetKeys.GRACE_PERIOD_MS] ?: 0L
    return nowMs < expiresAt + grace
  }

  suspend fun setOffline(context: Context, offline: Boolean) {
    context.widgetDataStore.edit { it[WidgetKeys.IS_OFFLINE] = offline }
  }

  suspend fun readIsOffline(context: Context): Boolean {
    return context.widgetDataStore.data.first()[WidgetKeys.IS_OFFLINE] ?: false
  }

  suspend fun setLastSuccessAt(context: Context, timestamp: Long) {
    context.widgetDataStore.edit { it[WidgetKeys.LAST_SUCCESS_AT] = timestamp }
  }

  suspend fun readLastSuccessAt(context: Context): Long {
    return context.widgetDataStore.data.first()[WidgetKeys.LAST_SUCCESS_AT] ?: 0L
  }

  // A user-initiated refresh marks this so the header shows "Refreshing…". The
  // worker always clears it explicitly on every exit path; this TTL is only a
  // last-resort safety net for a worker killed mid-fetch (process death) so the
  // spinner can't stick forever. It must stay above the worst-case fetch
  // duration (two parallel phases, 20s call timeout each) or it would clear the
  // spinner during a legitimately slow refresh on a poor network.
  private const val REFRESHING_TTL_MS = 45_000L

  // Freshness window after a successful fetch during which the header shows the
  // "✓ Up to date" confirmation. Derived purely from lastSuccessAt (no separate
  // flag), so every rendered frame is a valid resting state that decays by time
  // on its own — a dropped redraw can never strand a transient confirmation.
  const val CONFIRM_WINDOW_MS = 1_500L

  suspend fun beginRefreshing(context: Context, nowMs: Long) {
    context.widgetDataStore.edit { it[WidgetKeys.REFRESHING_STARTED_AT] = nowMs }
  }

  suspend fun clearRefreshing(context: Context) {
    context.widgetDataStore.edit { it.remove(WidgetKeys.REFRESHING_STARTED_AT) }
  }

  suspend fun isRefreshing(context: Context, nowMs: Long): Boolean {
    val startedAt = context.widgetDataStore.data.first()[WidgetKeys.REFRESHING_STARTED_AT] ?: return false
    return nowMs - startedAt in 0 until REFRESHING_TTL_MS
  }

  suspend fun readRefreshingStartedAt(context: Context): Long {
    return context.widgetDataStore.data.first()[WidgetKeys.REFRESHING_STARTED_AT] ?: 0L
  }

  suspend fun setDecimals(context: Context, decimals: Int) {
    context.widgetDataStore.edit { it[WidgetKeys.DECIMALS] = decimals.coerceIn(0, 8) }
  }

  suspend fun readDecimals(context: Context): Int {
    return context.widgetDataStore.data.first()[WidgetKeys.DECIMALS] ?: 3
  }

  private val VALID_PERIODS = setOf(7, 30, 90, 270, 365)
  private const val DEFAULT_PERIOD = 7

  suspend fun setPeriod(context: Context, days: Int) {
    val coerced = if (days in VALID_PERIODS) days else DEFAULT_PERIOD
    context.widgetDataStore.edit { it[WidgetKeys.WIDGET_PERIOD] = coerced }
  }

  suspend fun readPeriod(context: Context): Int {
    val stored = context.widgetDataStore.data.first()[WidgetKeys.WIDGET_PERIOD]
    return if (stored != null && stored in VALID_PERIODS) stored else DEFAULT_PERIOD
  }

  suspend fun writeStrings(context: Context, strings: Map<String, String>) {
    context.widgetDataStore.edit { prefs ->
      strings["watchlistTitle"]?.let { prefs[WidgetKeys.STRING_WATCHLIST_TITLE] = it }
      strings["updatedAt"]?.let { prefs[WidgetKeys.STRING_UPDATED_AT] = it }
      strings["offline"]?.let { prefs[WidgetKeys.STRING_OFFLINE] = it }
      strings["emptyState"]?.let { prefs[WidgetKeys.STRING_EMPTY_STATE] = it }
      strings["lockedHeadline"]?.let { prefs[WidgetKeys.STRING_LOCKED_HEADLINE] = it }
      strings["lockedTagline"]?.let { prefs[WidgetKeys.STRING_LOCKED_TAGLINE] = it }
      strings["lockedCta"]?.let { prefs[WidgetKeys.STRING_LOCKED_CTA] = it }
      strings["refreshing"]?.let { prefs[WidgetKeys.STRING_REFRESHING] = it }
      strings["upToDate"]?.let { prefs[WidgetKeys.STRING_UP_TO_DATE] = it }
    }
  }

  suspend fun readStrings(context: Context): WidgetStringsSnapshot {
    val prefs = context.widgetDataStore.data.first()
    val defaults = WidgetStringsSnapshot.default()
    return WidgetStringsSnapshot(
      watchlistTitle = prefs[WidgetKeys.STRING_WATCHLIST_TITLE] ?: defaults.watchlistTitle,
      updatedAt = prefs[WidgetKeys.STRING_UPDATED_AT] ?: defaults.updatedAt,
      offline = prefs[WidgetKeys.STRING_OFFLINE] ?: defaults.offline,
      emptyState = prefs[WidgetKeys.STRING_EMPTY_STATE] ?: defaults.emptyState,
      lockedHeadline = prefs[WidgetKeys.STRING_LOCKED_HEADLINE] ?: defaults.lockedHeadline,
      lockedTagline = prefs[WidgetKeys.STRING_LOCKED_TAGLINE] ?: defaults.lockedTagline,
      lockedCta = prefs[WidgetKeys.STRING_LOCKED_CTA] ?: defaults.lockedCta,
      refreshing = prefs[WidgetKeys.STRING_REFRESHING] ?: defaults.refreshing,
      upToDate = prefs[WidgetKeys.STRING_UP_TO_DATE] ?: defaults.upToDate
    )
  }
}

internal fun PairData.toMap(): Map<String, Any?> = mapOf(
  "from" to from,
  "to" to to,
  "rate" to rate,
  "variationPct" to variationPct,
  "sparklinePoints" to sparklinePoints
)
