package com.codeurdivoire.widget

import android.content.Context
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent

import com.codeurdivoire.widget.ui.LockedContent
import com.codeurdivoire.widget.ui.WatchlistContent

class WatchlistGlanceWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val now = System.currentTimeMillis()
    val isPro = WidgetDataStore.isProEffective(context, now)
    val strings = WidgetDataStore.readStrings(context)
    val pairs = if (isPro) WidgetDataStore.readPairs(context) else emptyList()
    val isOffline = if (isPro) WidgetDataStore.readIsOffline(context) else false
    val lastSuccessAt = if (isPro) WidgetDataStore.readLastSuccessAt(context) else 0L
    val isRefreshing = isPro && WidgetDataStore.isRefreshing(context, now)
    // Derived from the fetch timestamp, not a stored flag: the "✓ Up to date"
    // header simply IS the resting state for a short window after success, so it
    // decays on its own and never needs a precise "clear" redraw to undo it.
    val isConfirming = isPro && !isRefreshing && lastSuccessAt > 0L &&
      (now - lastSuccessAt) in 0 until WidgetDataStore.CONFIRM_WINDOW_MS
    val decimals = WidgetDataStore.readDecimals(context)
    val period = WidgetDataStore.readPeriod(context)

    provideContent {
      if (!isPro) {
        LockedContent(strings = strings)
      } else {
        WatchlistContent(
          pairs = pairs,
          isOffline = isOffline,
          isRefreshing = isRefreshing,
          isConfirming = isConfirming,
          lastSuccessAt = lastSuccessAt,
          strings = strings,
          decimals = decimals,
          period = period
        )
      }
    }
  }
}
