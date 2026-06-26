package com.codeurdivoire.widget

import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.glance.appwidget.updateAll
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WidgetWatchlistModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("WidgetWatchlist")

    // Single atomic state push: the previous-state reads (pairs, period, Pro
    // effectiveness) and the merged write all happen inside ONE DataStore
    // edit transaction, so a worker persist landing mid-sync can no longer
    // be clobbered by a merge computed against a stale snapshot.
    AsyncFunction("syncState") Coroutine { state: SyncStateRecord ->
      val ctx = appContext.reactContext
        ?: throw CodedException("ERR_WIDGET_CONTEXT", "React context unavailable", null)
      val shouldRefresh = withContext(Dispatchers.IO) {
        val isPro = state.isPro
        val expiresAtMs = state.expiresAtMs
        val gracePeriodMs = state.gracePeriodMs.coerceAtLeast(0L)
        val decimals = state.decimals.coerceIn(0, 8)
        val period = if (state.period in setOf(7, 30, 90, 270, 365)) state.period else 7
        val incomingPairs: List<Map<String, Any?>> = state.pairs.map { pair ->
          mapOf(
            "from" to pair.from,
            "to" to pair.to,
            "rate" to pair.rate,
            "variationPct" to pair.variationPct,
            "sparklinePoints" to pair.sparklinePoints
          )
        }
        val strings: Map<String, String> = state.strings

        var refresh = false
        ctx.widgetDataStore.edit { p ->
          val nowMs = System.currentTimeMillis()
          val previousPeriod = p[WidgetKeys.WIDGET_PERIOD] ?: 7
          val wasPro = p[WidgetKeys.IS_PRO] ?: false
          val prevExpiresAt = p[WidgetKeys.EXPIRES_AT]
          val prevGrace = p[WidgetKeys.GRACE_PERIOD_MS] ?: 0L
          val wasProEffective =
            wasPro && (prevExpiresAt == null || nowMs < prevExpiresAt + prevGrace)
          val isProEffectiveNow =
            isPro && (expiresAtMs == null || nowMs < expiresAtMs + gracePeriodMs)

          val existingPairs = p[WidgetKeys.PAIRS_JSON]?.let { raw ->
            try {
              WidgetDataStore.parsePairs(raw)
            } catch (e: Exception) {
              Log.w("WidgetSync", "syncState: corrupt existing pairs, dropping", e)
              emptyList()
            }
          } ?: emptyList()

          val periodChanged = previousPeriod != period
          val existingByKey = existingPairs.associateBy { "${it.from}/${it.to}" }
          val merged = incomingPairs.map { pair ->
            val key = "${pair["from"]}/${pair["to"]}"
            val existingPair = existingByKey[key]
            when {
              existingPair == null -> pair
              periodChanged -> existingPair.copy(
                variationPct = null,
                sparklinePoints = emptyList()
              ).toMap()
              else -> existingPair.toMap()
            }
          }
          val pairsKeysChanged =
            existingByKey.keys != merged.map { "${it["from"]}/${it["to"]}" }.toSet()

          p[WidgetKeys.IS_PRO] = isPro
          if (expiresAtMs == null) p.remove(WidgetKeys.EXPIRES_AT)
          else p[WidgetKeys.EXPIRES_AT] = expiresAtMs
          p[WidgetKeys.GRACE_PERIOD_MS] = gracePeriodMs
          p[WidgetKeys.DECIMALS] = decimals
          p[WidgetKeys.WIDGET_PERIOD] = period
          p[WidgetKeys.PAIRS_JSON] = WidgetDataStore.buildPairsJson(merged)
          strings["watchlistTitle"]?.let { p[WidgetKeys.STRING_WATCHLIST_TITLE] = it }
          strings["updatedAt"]?.let { p[WidgetKeys.STRING_UPDATED_AT] = it }
          strings["offline"]?.let { p[WidgetKeys.STRING_OFFLINE] = it }
          strings["emptyState"]?.let { p[WidgetKeys.STRING_EMPTY_STATE] = it }
          strings["lockedHeadline"]?.let { p[WidgetKeys.STRING_LOCKED_HEADLINE] = it }
          strings["lockedTagline"]?.let { p[WidgetKeys.STRING_LOCKED_TAGLINE] = it }
          strings["lockedCta"]?.let { p[WidgetKeys.STRING_LOCKED_CTA] = it }
          strings["refreshing"]?.let { p[WidgetKeys.STRING_REFRESHING] = it }
          strings["upToDate"]?.let { p[WidgetKeys.STRING_UP_TO_DATE] = it }

          // A Pro state becoming effective (purchase, or renewal after a
          // lock) must trigger a fetch: the stored pairs still hold rate=0
          // or stale data from before the lock.
          refresh = isProEffectiveNow && (pairsKeysChanged || periodChanged || !wasProEffective)
        }
        refresh
      }
      WatchlistGlanceWidget().updateAll(ctx)
      if (shouldRefresh) {
        // A config change (pairs/period/Pro-effective) supersedes any in-flight
        // fetch, which is now fetching stale inputs.
        WidgetRefreshScheduler.request(ctx, RefreshReason.CONFIG)
      }
    }

    AsyncFunction("requestRefresh") {
      val ctx = appContext.reactContext
        ?: throw CodedException("ERR_WIDGET_CONTEXT", "React context unavailable", null)
      // JS-originated (app mount, foreground, sync tail): the worker coalesces
      // these on data freshness.
      WidgetRefreshScheduler.request(ctx, RefreshReason.BACKGROUND)
    }

    AsyncFunction("isWidgetAdded") {
      appContext.reactContext?.let { WidgetState.isAdded(it) } ?: false
    }

    AsyncFunction("drainAnalytics") Coroutine { _: Boolean ->
      appContext.reactContext?.let { ctx ->
        withContext(Dispatchers.IO) {
          WidgetAnalyticsLog.drain(ctx)
        }
      } ?: emptyList<Map<String, Any>>()
    }
  }
}

class PairRecord : Record {
  @Field val from: String = ""
  @Field val to: String = ""
  @Field val rate: Double = 0.0
  @Field val variationPct: Double? = null
  @Field val sparklinePoints: List<Double> = emptyList()
}

class SyncStateRecord : Record {
  @Field val isPro: Boolean = false
  @Field val expiresAtMs: Long? = null
  @Field val gracePeriodMs: Long = 0L
  @Field val decimals: Int = 3
  @Field val period: Int = 7
  @Field val pairs: List<PairRecord> = emptyList()
  @Field val strings: Map<String, String> = emptyMap()
}
