package com.codeurdivoire.widget.ui

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.text.format.DateFormat
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.ColorFilter
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.CircularProgressIndicator
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.RowScope
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.codeurdivoire.widget.PairData
import com.codeurdivoire.widget.R
import com.codeurdivoire.widget.RefreshActionCallback
import com.codeurdivoire.widget.WidgetStringsSnapshot
import java.util.Date

@Composable
fun WatchlistContent(
  pairs: List<PairData>,
  isOffline: Boolean,
  isRefreshing: Boolean,
  isConfirming: Boolean,
  lastSuccessAt: Long,
  strings: WidgetStringsSnapshot,
  decimals: Int,
  period: Int
) {
  val context = LocalContext.current
  val isRtl = context.resources.configuration.layoutDirection == View.LAYOUT_DIRECTION_RTL

  val timeString = when {
    isRefreshing -> strings.refreshing
    isConfirming -> "✓ ${strings.upToDate}"
    isOffline || lastSuccessAt == 0L -> strings.offline
    else -> strings.updatedAt.replace("{time}", formatTime(context, lastSuccessAt))
  }
  val titleColor = if (isConfirming) R.color.widget_up else R.color.widget_muted

  val homeIntent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse("allcurencyconverter:///?source=widget_header")
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
  }

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(ColorProvider(R.color.widget_background))
      .cornerRadius(18.dp)
      .padding(horizontal = 16.dp, vertical = 12.dp)
  ) {
    Row(
      modifier = GlanceModifier
        .fillMaxWidth()
        .clickable(actionStartActivity(homeIntent)),
      verticalAlignment = Alignment.CenterVertically
    ) {
      val title = "${strings.watchlistTitle} · $timeString"
      if (isRtl) {
        ProBadge()
        RefreshButton(isRefreshing = isRefreshing)
        HeaderTitle(text = title, color = titleColor)
      } else {
        HeaderTitle(text = title, color = titleColor)
        RefreshButton(isRefreshing = isRefreshing)
        ProBadge()
      }
    }
    Spacer(modifier = GlanceModifier.height(6.dp))

    val visible = pairs.take(3)
    if (visible.isEmpty()) {
      EmptyState(message = strings.emptyState, intent = homeIntent)
    } else {
      visible.forEachIndexed { idx, p ->
        WatchlistRow(pair = p, position = idx, decimals = decimals, isRtl = isRtl, period = period)
        if (idx < visible.size - 1) {
          Spacer(modifier = GlanceModifier.height(2.dp))
        }
      }
    }
  }
}

@Composable
private fun RowScope.HeaderTitle(text: String, color: Int) {
  Text(
    text = text,
    style = TextStyle(
      color = ColorProvider(color),
      fontSize = 11.sp,
      fontWeight = FontWeight.Bold
    ),
    modifier = GlanceModifier.defaultWeight()
  )
}

@Composable
private fun ProBadge() {
  Box(
    modifier = GlanceModifier
      .background(ColorProvider(R.color.widget_pro_badge_start))
      .cornerRadius(4.dp)
      .padding(horizontal = 6.dp, vertical = 1.dp)
  ) {
    Text(
      text = "PRO",
      style = TextStyle(
        color = ColorProvider(R.color.widget_pro_badge_text),
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold
      )
    )
  }
}

@Composable
private fun RefreshButton(isRefreshing: Boolean) {
  // A native indeterminate spinner replaces the icon while a fetch runs, so the
  // tap always reads as "working" even when fresh rates land instantly. Taps
  // during this state are a no-op until it finishes (KEEP).
  Box(
    modifier = GlanceModifier
      .padding(horizontal = 6.dp, vertical = 2.dp)
      .clickable(actionRunCallback<RefreshActionCallback>()),
    contentAlignment = Alignment.Center
  ) {
    if (isRefreshing) {
      CircularProgressIndicator(
        modifier = GlanceModifier.size(16.dp),
        color = ColorProvider(R.color.widget_foreground)
      )
    } else {
      Image(
        provider = ImageProvider(R.drawable.ic_widget_refresh),
        contentDescription = null,
        colorFilter = ColorFilter.tint(ColorProvider(R.color.widget_foreground)),
        modifier = GlanceModifier.size(16.dp)
      )
    }
  }
}

@Composable
private fun EmptyState(message: String, intent: Intent) {
  Box(
    modifier = GlanceModifier
      .fillMaxWidth()
      .padding(vertical = 16.dp)
      .clickable(actionStartActivity(intent)),
    contentAlignment = Alignment.Center
  ) {
    Text(
      text = message,
      style = TextStyle(
        color = ColorProvider(R.color.widget_muted),
        fontSize = 12.sp
      )
    )
  }
}

private fun formatTime(context: Context, epochMillis: Long): String {
  return DateFormat.getTimeFormat(context).format(Date(epochMillis))
}
