package com.codeurdivoire.widget

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import androidx.glance.GlanceId
import androidx.glance.action.ActionParameters
import androidx.glance.appwidget.action.ActionCallback

// Tapped from the widget header: fires an instant haptic acknowledgement (the one
// feedback that stays reliable on launchers that throttle widget redraws), marks
// the refreshing state, and enqueues a user-priority refresh. The worker owns
// every redraw from here, so renders flow through a single, serialized source
// instead of racing the worker for the same glanceId (which Glance coalesces).
class RefreshActionCallback : ActionCallback {
  override suspend fun onAction(
    context: Context,
    glanceId: GlanceId,
    parameters: ActionParameters
  ) {
    val now = System.currentTimeMillis()
    val lastSuccessAt = WidgetDataStore.readLastSuccessAt(context)
    // Re-tapping inside the freshness-derived "✓ Up to date" window is a no-op:
    // the worker still holds the unique-work slot during its settle delay, so a
    // KEEP enqueue would be dropped and strand the refreshing flag with no worker
    // left to clear it.
    val confirming = lastSuccessAt > 0L &&
      (now - lastSuccessAt) in 0 until WidgetDataStore.CONFIRM_WINDOW_MS
    if (WidgetDataStore.isRefreshing(context, now) || confirming) return
    performHapticTick(context)
    WidgetDataStore.beginRefreshing(context, now)
    WidgetRefreshScheduler.request(context, RefreshReason.USER)
  }

  // Plain VibrationEffect / legacy overloads (no VibrationAttributes): a single
  // light tick has no audio-coupling concern, so the simpler APIs are fine.
  @Suppress("DEPRECATION")
  private fun performHapticTick(context: Context) {
    val vibrator = resolveVibrator(context) ?: return
    if (!vibrator.hasVibrator()) return
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ->
        vibrator.vibrate(VibrationEffect.createPredefined(VibrationEffect.EFFECT_TICK))
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.O ->
        vibrator.vibrate(VibrationEffect.createOneShot(15L, VibrationEffect.DEFAULT_AMPLITUDE))
      else -> vibrator.vibrate(15L)
    }
  }

  private fun resolveVibrator(context: Context): Vibrator? =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
    }
}
