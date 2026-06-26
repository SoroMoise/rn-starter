package com.codeurdivoire.widget

import android.content.Context
import android.os.Build
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.Data
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.OutOfQuotaPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit
import kotlin.random.Random

enum class RefreshReason { CONFIG, USER, BACKGROUND, PERIODIC }

object WidgetRefreshScheduler {
  const val KEY_REASON = "reason"

  // Versioned so a future interval/constraint change can be migrated by bumping
  // the name; the legacy name is cancelled once on (re)schedule.
  private const val UNIQUE_PERIODIC = "widget-watchlist-refresh-periodic-v2"
  private const val LEGACY_UNIQUE_PERIODIC = "widget-watchlist-refresh-periodic"
  private const val UNIQUE_ONESHOT = "widget-watchlist-refresh-now"
  private const val BACKOFF_DELAY_SECONDS = 30L
  private const val PERIODIC_JITTER_MAX_SECONDS = 15L * 60L

  fun schedulePeriodic(context: Context) {
    val wm = WorkManager.getInstance(context)
    wm.cancelUniqueWork(LEGACY_UNIQUE_PERIODIC)
    val constraints = Constraints.Builder()
      .setRequiredNetworkType(NetworkType.CONNECTED)
      .build()
    // Spread first-fire across a 15-min window so concurrent installs don't
    // hammer the backend in the same minute. Subsequent fires inherit the
    // shifted schedule.
    val jitterSeconds = Random.nextLong(0, PERIODIC_JITTER_MAX_SECONDS)
    val req = PeriodicWorkRequestBuilder<WidgetRefreshWorker>(1, TimeUnit.HOURS)
      .setConstraints(constraints)
      .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_DELAY_SECONDS, TimeUnit.SECONDS)
      .setInitialDelay(jitterSeconds, TimeUnit.SECONDS)
      .setInputData(reasonData(RefreshReason.PERIODIC))
      .build()
    // UPDATE (not KEEP) so an interval/constraint change in a new app version
    // reaches installs that already have a schedule running.
    wm.enqueueUniquePeriodicWork(UNIQUE_PERIODIC, ExistingPeriodicWorkPolicy.UPDATE, req)
  }

  fun cancelPeriodic(context: Context) {
    WorkManager.getInstance(context).cancelUniqueWork(UNIQUE_PERIODIC)
  }

  fun cancelAll(context: Context) {
    val wm = WorkManager.getInstance(context)
    wm.cancelUniqueWork(UNIQUE_PERIODIC)
    wm.cancelUniqueWork(UNIQUE_ONESHOT)
  }

  // Single entry point for every on-demand refresh. The reason decides how
  // aggressively we run:
  //  - CONFIG: stored pairs/period changed, so an in-flight fetch is now
  //    fetching the wrong thing → REPLACE it; expedited so fresh data lands fast.
  //  - USER: header button. KEEP (mashing while a fetch runs is a no-op),
  //    expedited, and NO network constraint so an offline tap runs and fails
  //    fast (→ "Offline") instead of silently waiting for connectivity.
  //  - BACKGROUND: foreground / sync tail. KEEP; the worker itself skips the
  //    network when data is still fresh.
  fun request(context: Context, reason: RefreshReason) {
    val wm = WorkManager.getInstance(context)
    val hasNetworkConstraint = reason != RefreshReason.USER
    val expedited =
      (reason == RefreshReason.CONFIG || reason == RefreshReason.USER) &&
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
    val policy =
      if (reason == RefreshReason.CONFIG) ExistingWorkPolicy.REPLACE else ExistingWorkPolicy.KEEP

    val builder = OneTimeWorkRequestBuilder<WidgetRefreshWorker>()
      .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, BACKOFF_DELAY_SECONDS, TimeUnit.SECONDS)
      .setInputData(reasonData(reason))

    if (hasNetworkConstraint) {
      builder.setConstraints(
        Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
      )
    }
    // Expedited jobs need no foreground service on API 31+; below that they
    // would force a user-visible notification, so we stay non-expedited there.
    if (expedited) {
      builder.setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
    }

    wm.enqueueUniqueWork(UNIQUE_ONESHOT, policy, builder.build())
  }

  private fun reasonData(reason: RefreshReason): Data =
    Data.Builder().putString(KEY_REASON, reason.name).build()
}
