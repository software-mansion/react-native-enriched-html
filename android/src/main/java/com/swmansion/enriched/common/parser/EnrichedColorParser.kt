package com.swmansion.enriched.common.parser

import android.graphics.Color
import androidx.core.graphics.toColorInt
import kotlin.math.roundToInt

object EnrichedColorParser {
  @JvmStatic
  fun parseCssColor(value: String?): Int? {
    if (value.isNullOrBlank()) return null

    var str = value.trim().lowercase()

    // Handle Named Colors
    if (CSS_NAMED_COLORS.containsKey(str)) {
      str = CSS_NAMED_COLORS[str]!!
    }

    // Handle Hex (#FFF, #FFFFFF, #FFFFFFFF CSS format)
    if (str.startsWith("#")) {
      val hex = str.substring(1)
      return try {
        when (hex.length) {
          3 -> {
            // #RGB -> #RRGGBB
            val expanded = "${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}"
            "#$expanded".toColorInt()
          }

          4 -> {
            // #RGBA -> #AARRGGBB
            val expanded = "${hex[3]}${hex[3]}${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}"
            "#$expanded".toColorInt()
          }

          6 -> {
            // #RRGGBB
            str.toColorInt()
          }

          8 -> {
            // #RRGGBBAA -> #AARRGGBB
            val aarrggbb = "#${hex.substring(6, 8)}${hex.substring(0, 6)}"
            aarrggbb.toColorInt()
          }

          else -> {
            null
          }
        }
      } catch (_: IllegalArgumentException) {
        null
      }
    }

    // Handle rgb() and rgba()
    if (str.startsWith("rgb")) {
      return try {
        val start = str.indexOf('(') + 1
        val end = str.indexOf(')')
        if (start <= 0 || end <= start) return null

        val parts = str.substring(start, end).split(",")
        if (parts.size >= 3) {
          val r =
            parts[0]
              .trim()
              .toFloat()
              .roundToInt()
              .coerceIn(0, 255)
          val g =
            parts[1]
              .trim()
              .toFloat()
              .roundToInt()
              .coerceIn(0, 255)
          val b =
            parts[2]
              .trim()
              .toFloat()
              .roundToInt()
              .coerceIn(0, 255)

          val a =
            if (parts.size == 4) {
              (parts[3].trim().toFloat() * 255f).roundToInt().coerceIn(0, 255)
            } else {
              255
            }

          Color.argb(a, r, g, b)
        } else {
          null
        }
      } catch (_: Exception) {
        null
      }
    }

    // Catch any native Android colors if missed
    return try {
      str.toColorInt()
    } catch (_: IllegalArgumentException) {
      null
    }
  }

  @JvmStatic
  fun colorToHex(color: Int): String {
    val alpha = (color ushr 24) and 0xFF
    val red = (color shr 16) and 0xFF
    val green = (color shr 8) and 0xFF
    val blue = color and 0xFF

    return if (alpha == 255) {
      String.format("#%02X%02X%02X", red, green, blue)
    } else {
      String.format("#%02X%02X%02X%02X", red, green, blue, alpha)
    }
  }
}
