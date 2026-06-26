package com.codeurdivoire.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

class WatchlistGlanceReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = WatchlistGlanceWidget()

  override fun onEnabled(context: Context) {
    super.onEnabled(context)
    WidgetRefreshScheduler.schedulePeriodic(context)
    // First widget added: force an immediate fetch (stored pairs are unset/stale).
    WidgetRefreshScheduler.request(context, RefreshReason.CONFIG)
  }

  override fun onDisabled(context: Context) {
    super.onDisabled(context)
    WidgetRefreshScheduler.cancelAll(context)
  }
}
