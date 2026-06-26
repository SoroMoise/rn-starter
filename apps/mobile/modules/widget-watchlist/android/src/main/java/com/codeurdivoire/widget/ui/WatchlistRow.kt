package com.codeurdivoire.widget.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.LocalContext
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.layout.Alignment
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.RowScope
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.codeurdivoire.widget.PairData
import com.codeurdivoire.widget.R
import com.codeurdivoire.widget.SparklineRenderer
import java.util.Locale
import kotlin.math.abs

@Composable
fun WatchlistRow(pair: PairData, position: Int, decimals: Int, isRtl: Boolean, period: Int) {
  val pairIntent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse(
      "allcurencyconverter:///statistics?from=${pair.from}&to=${pair.to}&source=widget_pair&position=$position&period=$period"
    )
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
  }

  val context = LocalContext.current
  val sparklineBitmap = remember(pair.sparklinePoints) {
    SparklineRenderer.render(context, pair.sparklinePoints)
  }

  Row(
    modifier = GlanceModifier
      .fillMaxWidth()
      .padding(vertical = 4.dp)
      .clickable(actionStartActivity(pairIntent)),
    verticalAlignment = Alignment.CenterVertically
  ) {
    if (isRtl) {
      VariationCell(variation = pair.variationPct)
      Spacer(modifier = GlanceModifier.width(8.dp))
      SparklineCell(bitmap = sparklineBitmap)
      NameCell(pair = pair, decimals = decimals, isRtl = true)
    } else {
      NameCell(pair = pair, decimals = decimals, isRtl = false)
      SparklineCell(bitmap = sparklineBitmap)
      Spacer(modifier = GlanceModifier.width(8.dp))
      VariationCell(variation = pair.variationPct)
    }
  }
}

@Composable
private fun RowScope.NameCell(pair: PairData, decimals: Int, isRtl: Boolean) {
  Column(
    modifier = GlanceModifier.defaultWeight(),
    horizontalAlignment = if (isRtl) Alignment.End else Alignment.Start
  ) {
    Text(
      text = "${pair.from} / ${pair.to}",
      style = TextStyle(
        color = ColorProvider(R.color.widget_foreground),
        fontSize = 13.sp,
        fontWeight = FontWeight.Bold
      )
    )
    Text(
      text = formatRate(pair, decimals),
      style = TextStyle(
        color = ColorProvider(R.color.widget_muted),
        fontSize = 12.sp
      )
    )
  }
}

@Composable
private fun SparklineCell(bitmap: android.graphics.Bitmap) {
  Image(
    provider = ImageProvider(bitmap),
    contentDescription = null,
    modifier = GlanceModifier.width(60.dp).height(22.dp)
  )
}

@Composable
private fun VariationCell(variation: Double?) {
  Text(
    text = formatVariation(variation),
    style = TextStyle(
      color = ColorProvider(variationColorRes(variation)),
      fontSize = 12.sp,
      fontWeight = FontWeight.Bold,
      textAlign = TextAlign.End,
    ),
    modifier = GlanceModifier.width(52.dp)
  )
}

// A never-fetched pair carries the rate=0 sentinel with no history yet: show an
// honest placeholder instead of a fake "0.000" until the first refresh lands.
private fun formatRate(pair: PairData, decimals: Int): String {
  if (pair.rate == 0.0 && pair.sparklinePoints.isEmpty() && pair.variationPct == null) return "—"
  val clamped = decimals.coerceIn(0, 8)
  return String.format(Locale.ROOT, "%.${clamped}f", pair.rate)
}

private fun formatVariation(variation: Double?): String {
  if (variation == null) return "—"
  val sign = when {
    variation > 0 -> "+"
    variation < 0 -> "−"
    else -> ""
  }
  return "$sign${String.format(Locale.ROOT, "%.2f", abs(variation))}%"
}

private fun variationColorRes(variation: Double?): Int {
  if (variation == null || abs(variation) < 0.01) return R.color.widget_neutral
  return if (variation > 0) R.color.widget_up else R.color.widget_down
}
