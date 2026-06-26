package com.codeurdivoire.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.util.TypedValue
import androidx.core.content.ContextCompat

object SparklineRenderer {

  private const val WIDTH_DP = 60
  private const val HEIGHT_DP = 22
  private const val STROKE_DP = 1.5f
  private const val FLAT_THRESHOLD_PCT = 0.0001

  // 1×1 transparent placeholder shared across all rows that have no data
  // (e.g. right after a period change). Avoids allocating a 44 KB bitmap
  // per empty row on every recomposition.
  private val emptyBitmap: Bitmap by lazy {
    Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
  }

  fun render(context: Context, points: List<Double>): Bitmap {
    if (points.size < 2) return emptyBitmap

    val density = context.resources.displayMetrics.density
    val width = (WIDTH_DP * density).toInt().coerceAtLeast(1)
    val height = (HEIGHT_DP * density).toInt().coerceAtLeast(1)
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      color = ContextCompat.getColor(context, colorResFor(points))
      style = Paint.Style.STROKE
      strokeWidth = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, STROKE_DP, context.resources.displayMetrics
      )
      strokeCap = Paint.Cap.ROUND
      strokeJoin = Paint.Join.ROUND
    }

    val min = points.min()
    val max = points.max()
    val range = (max - min).takeIf { it > 0 } ?: 1.0
    val padding = paint.strokeWidth
    val stepX = (width - 2 * padding) / (points.size - 1)

    val path = Path()
    points.forEachIndexed { i, v ->
      val x = padding + i * stepX
      val normalized = (v - min) / range
      val y = (height - padding) - (normalized * (height - 2 * padding)).toFloat()
      if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
    }
    canvas.drawPath(path, paint)
    return bitmap
  }

  private fun colorResFor(points: List<Double>): Int {
    val first = points.first()
    val last = points.last()
    val deltaPct = if (first != 0.0) (last - first) / first else 0.0
    return when {
      kotlin.math.abs(deltaPct) < FLAT_THRESHOLD_PCT -> R.color.widget_neutral
      deltaPct > 0 -> R.color.widget_up
      else -> R.color.widget_down
    }
  }
}
