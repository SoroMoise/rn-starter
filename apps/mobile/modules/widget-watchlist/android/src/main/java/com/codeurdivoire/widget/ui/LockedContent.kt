package com.codeurdivoire.widget.ui

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceModifier
import androidx.glance.action.clickable
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.unit.ColorProvider
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.codeurdivoire.widget.R
import com.codeurdivoire.widget.WidgetStringsSnapshot

@Composable
fun LockedContent(strings: WidgetStringsSnapshot) {
  val paywallIntent = Intent(Intent.ACTION_VIEW).apply {
    data = Uri.parse("allcurencyconverter:///?source=widget_locked")
    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
  }

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(ColorProvider(R.color.widget_background))
      .cornerRadius(18.dp)
      .padding(16.dp)
      .clickable(actionStartActivity(paywallIntent)),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Text(
      text = "✨ ${strings.lockedHeadline}",
      style = TextStyle(
        color = ColorProvider(R.color.widget_foreground),
        fontSize = 16.sp,
        fontWeight = FontWeight.Bold
      )
    )
    Spacer(modifier = GlanceModifier.height(4.dp))
    Text(
      text = strings.lockedTagline,
      style = TextStyle(
        color = ColorProvider(R.color.widget_muted),
        fontSize = 12.sp
      )
    )
    Spacer(modifier = GlanceModifier.height(12.dp))
    Box(
      modifier = GlanceModifier
        .background(ColorProvider(R.color.widget_pro_badge_start))
        .cornerRadius(8.dp)
        .padding(horizontal = 14.dp, vertical = 8.dp)
        .fillMaxWidth(),
      contentAlignment = Alignment.Center
    ) {
      Text(
        text = strings.lockedCta,
        style = TextStyle(
          color = ColorProvider(R.color.widget_pro_badge_text),
          fontSize = 13.sp,
          fontWeight = FontWeight.Bold
        )
      )
    }
  }
}
