package com.codeurdivoire.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context

object WidgetState {
  fun isAdded(context: Context): Boolean {
    return try {
      val manager = AppWidgetManager.getInstance(context)
      val provider = ComponentName(context, WatchlistGlanceReceiver::class.java)
      manager.getAppWidgetIds(provider).isNotEmpty()
    } catch (e: Exception) {
      false
    }
  }
}
