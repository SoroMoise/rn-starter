package com.codeurdivoire.widget

import android.content.Context
import android.util.Log
import androidx.glance.appwidget.updateAll
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.delay

class WidgetRefreshWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {

  private var reason: RefreshReason = RefreshReason.BACKGROUND
  private var refreshingStartedAt: Long = 0L

  override suspend fun doWork(): Result {
    reason = runCatching {
      RefreshReason.valueOf(inputData.getString(WidgetRefreshScheduler.KEY_REASON).orEmpty())
    }.getOrDefault(RefreshReason.BACKGROUND)
    refreshingStartedAt = WidgetDataStore.readRefreshingStartedAt(applicationContext)
    Log.i(TAG, "doWork: start reason=$reason")
    return try {
      if (!WidgetDataStore.isProEffective(applicationContext, System.currentTimeMillis())) {
        Log.i(TAG, "doWork: subscription not effective, rendering locked (early SUCCESS)")
        renderWidget()
        return Result.success()
      }

      // Background refreshes (foreground, sync tail) coalesce on freshness: if a
      // successful fetch happened recently there is nothing to gain from another
      // round-trip. User / config / periodic refreshes always proceed.
      if (reason == RefreshReason.BACKGROUND) {
        val sinceSuccess =
          System.currentTimeMillis() - WidgetDataStore.readLastSuccessAt(applicationContext)
        if (sinceSuccess in 0 until FRESHNESS_WINDOW_MS) {
          Log.i(TAG, "doWork: data fresh (${sinceSuccess}ms old), skipping (early SUCCESS)")
          return Result.success()
        }
      }

      val pairs = WidgetDataStore.readPairs(applicationContext)
      Log.d(TAG, "doWork: pairs.size=${pairs.size} pairs=${pairs.joinToString { "${it.from}/${it.to}" }}")
      if (pairs.isEmpty()) {
        Log.i(TAG, "doWork: no pairs in DataStore, nothing to refresh (early SUCCESS)")
        renderWidget()
        return Result.success()
      }

      // Single render source: the callback only marks the state, the worker owns
      // every redraw. Push the spinner from here so a user tap never races the
      // callback and the worker for the same glanceId (which Glance coalesces).
      if (reason == RefreshReason.USER) {
        WatchlistGlanceWidget().updateAll(applicationContext)
      }

      val outcome = WidgetBackend.refresh(applicationContext, pairs)
      Log.i(TAG, "doWork: outcome.error=${outcome.error} refreshed.size=${outcome.pairs.size}")
      outcome.pairs.forEach { p ->
        Log.d(TAG, "doWork: pair ${p.from}/${p.to} rate=${p.rate} var=${p.variationPct} points=${p.sparklinePoints.size}")
      }

      handleOutcome(outcome)
    } catch (e: CancellationException) {
      // REPLACE policy cancels the in-flight oneshot: propagate so WorkManager
      // records CANCELLED instead of logging a fake network failure.
      throw e
    } catch (e: Exception) {
      Log.e(TAG, "doWork: unexpected exception, marking offline + retry", e)
      WidgetAnalyticsLog.appendFail(applicationContext, "network")
      WidgetDataStore.setOffline(applicationContext, true)
      renderWidget()
      retryOrFail()
    }
  }

  private suspend fun handleOutcome(outcome: WidgetBackend.RefreshOutcome): Result {
    when (outcome.error) {
      WidgetBackend.ErrorKind.NONE -> {
        persistRefreshed(outcome.pairs, offline = false)
        WidgetAnalyticsLog.appendSuccess(applicationContext)
        Log.i(TAG, "doWork: SUCCESS")
        renderSuccess()
        return Result.success()
      }
      WidgetBackend.ErrorKind.PARTIAL -> {
        persistRefreshed(outcome.pairs, offline = false)
        WidgetAnalyticsLog.appendFail(applicationContext, "partial")
        Log.w(TAG, "doWork: PARTIAL success, persisting fresh slice")
        renderSuccess()
        return Result.success()
      }
      WidgetBackend.ErrorKind.CONFIG -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "config")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.e(TAG, "doWork: CONFIG missing — stopping (Result.failure)")
        return Result.failure()
      }
      WidgetBackend.ErrorKind.HTTP_4XX -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "http_4xx")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.e(TAG, "doWork: HTTP 4xx — stopping (Result.failure)")
        return Result.failure()
      }
      WidgetBackend.ErrorKind.PARSE -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "parse")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.e(TAG, "doWork: parse error — stopping (Result.failure)")
        return Result.failure()
      }
      WidgetBackend.ErrorKind.HTTP_429 -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "http_429")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.w(TAG, "doWork: HTTP 429 rate-limited — retry")
        return retryOrFail()
      }
      WidgetBackend.ErrorKind.HTTP_5XX -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "http_5xx")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.w(TAG, "doWork: HTTP 5xx — retry")
        return retryOrFail()
      }
      WidgetBackend.ErrorKind.NETWORK -> {
        WidgetAnalyticsLog.appendFail(applicationContext, "network")
        WidgetDataStore.setOffline(applicationContext, true)
        renderWidget()
        Log.w(TAG, "doWork: network — retry")
        return retryOrFail()
      }
    }
  }

  private fun retryOrFail(): Result =
    if (runAttemptCount >= MAX_RETRY_ATTEMPTS) {
      Log.w(TAG, "doWork: giving up after $runAttemptCount attempts")
      Result.failure()
    } else {
      Result.retry()
    }

  private suspend fun persistRefreshed(pairs: List<PairData>, offline: Boolean) {
    WidgetDataStore.mergeRefreshedPairs(applicationContext, pairs)
    WidgetDataStore.setOffline(applicationContext, offline)
    WidgetDataStore.setLastSuccessAt(applicationContext, System.currentTimeMillis())
  }

  // Pads the user-tap spinner to its minimum visible window, measured from the
  // tap. A fast fetch is held so the "Refreshing…" state lives long enough to be
  // perceived where the launcher does redraw promptly; a slow fetch has already
  // paid the window, so there is no extra wait. No-op for non-user reasons.
  private suspend fun holdSpinner() {
    if (reason != RefreshReason.USER) return
    val shown = System.currentTimeMillis() - refreshingStartedAt
    if (shown in 0 until SPINNER_MIN_MS) {
      delay(SPINNER_MIN_MS - shown)
    }
  }

  // Any worker render means the refresh attempt has produced a result, so the
  // "Refreshing…" indicator (if a user tap set it) is cleared in the same pass.
  private suspend fun renderWidget() {
    holdSpinner()
    WidgetDataStore.clearRefreshing(applicationContext)
    WatchlistGlanceWidget().updateAll(applicationContext)
  }

  // Success terminal for a user tap. After the spinner's minimum window, clear it
  // and render once: the header derives "✓ Up to date" from the just-written
  // lastSuccessAt, so the tap reads as successful even when rates did not move.
  // A second render after the confirmation window settles back to the timestamp.
  // Every frame here is a valid resting state, so a launcher that drops a redraw
  // strands a coherent header (✓ or timestamp), never a frozen spinner.
  private suspend fun renderSuccess() {
    holdSpinner()
    WidgetDataStore.clearRefreshing(applicationContext)
    WatchlistGlanceWidget().updateAll(applicationContext)
    if (reason == RefreshReason.USER) {
      delay(WidgetDataStore.CONFIRM_WINDOW_MS)
      WatchlistGlanceWidget().updateAll(applicationContext)
    }
  }

  companion object {
    private const val TAG = "WidgetRefreshWorker"
    private const val MAX_RETRY_ATTEMPTS = 5
    private const val FRESHNESS_WINDOW_MS = 5L * 60L * 1000L
    private const val SPINNER_MIN_MS = 700L
  }
}
