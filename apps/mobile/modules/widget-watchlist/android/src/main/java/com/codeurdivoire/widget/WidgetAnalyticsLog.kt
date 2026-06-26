package com.codeurdivoire.widget

import android.content.Context
import android.util.Log
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import org.json.JSONArray
import org.json.JSONObject

object WidgetAnalyticsLog {
  private const val TAG = "WidgetAnalyticsLog"
  private val KEY_LOG = stringPreferencesKey("analytics_log")
  private const val MAX_ENTRIES = 100

  suspend fun appendSuccess(context: Context) {
    append(context, "widget_refresh_success", JSONObject())
  }

  suspend fun appendFail(context: Context, errorType: String) {
    append(context, "widget_refresh_fail", JSONObject().put("error_type", errorType))
  }

  private suspend fun append(context: Context, event: String, params: JSONObject) {
    val timestamped = params.put("at", System.currentTimeMillis())
    context.widgetDataStore.edit { prefs ->
      val current = prefs[KEY_LOG]?.let { runCatching { JSONArray(it) }.getOrDefault(JSONArray()) }
        ?: JSONArray()
      current.put(JSONObject().put("event", event).put("params", timestamped))
      val trimmed = if (current.length() > MAX_ENTRIES) {
        val out = JSONArray()
        val start = current.length() - MAX_ENTRIES
        for (i in start until current.length()) out.put(current.get(i))
        out
      } else current
      prefs[KEY_LOG] = trimmed.toString()
    }
  }

  suspend fun drain(context: Context): List<Map<String, Any>> {
    var snapshot: String? = null
    context.widgetDataStore.edit { prefs ->
      snapshot = prefs[KEY_LOG]
      prefs.remove(KEY_LOG)
    }
    val raw = snapshot ?: return emptyList()
    return try {
      val arr = JSONArray(raw)
      (0 until arr.length()).map { i ->
        val obj = arr.getJSONObject(i)
        mapOf(
          "event" to obj.getString("event"),
          "params" to obj.getJSONObject("params").toMap()
        )
      }
    } catch (e: Exception) {
      Log.e(TAG, "drain: corrupt JSON, dropped ${raw.length} bytes", e)
      emptyList()
    }
  }

  private fun JSONObject.toMap(): Map<String, Any> {
    val map = mutableMapOf<String, Any>()
    keys().forEach { k -> map[k] = get(k) }
    return map
  }
}
