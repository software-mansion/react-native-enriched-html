package com.swmansion.enriched.common.parser

import android.graphics.Color
import androidx.core.graphics.toColorInt
import kotlin.math.roundToInt

object EnrichedColorParser {
  private val CSS_NAMED_COLORS =
    mapOf(
      "aliceblue" to "#F0F8FFFF",
      "antiquewhite" to "#FAEBD7FF",
      "aqua" to "#00FFFFFF",
      "aquamarine" to "#7FFFD4FF",
      "azure" to "#F0FFFFFF",
      "beige" to "#F5F5DCFF",
      "bisque" to "#FFE4C4FF",
      "black" to "#000000FF",
      "blanchedalmond" to "#FFEBCDFF",
      "blue" to "#0000FFFF",
      "blueviolet" to "#8A2BE2FF",
      "brown" to "#A52A2AFF",
      "burlywood" to "#DEB887FF",
      "cadetblue" to "#5F9EA0FF",
      "chartreuse" to "#7FFF00FF",
      "chocolate" to "#D2691EFF",
      "coral" to "#FF7F50FF",
      "cornflowerblue" to "#6495EDFF",
      "cornsilk" to "#FFF8DCFF",
      "crimson" to "#DC143CFF",
      "cyan" to "#00FFFFFF",
      "darkblue" to "#00008BFF",
      "darkcyan" to "#008B8BFF",
      "darkgoldenrod" to "#B8860BFF",
      "darkgray" to "#A9A9A9FF",
      "darkgrey" to "#A9A9A9FF",
      "darkgreen" to "#006400FF",
      "darkkhaki" to "#BDB76BFF",
      "darkmagenta" to "#8B008BFF",
      "darkolivegreen" to "#556B2FFF",
      "darkorange" to "#FF8C00FF",
      "darkorchid" to "#9932CCFF",
      "darkred" to "#8B0000FF",
      "darksalmon" to "#E9967AFF",
      "darkseagreen" to "#8FBC8FFF",
      "darkslateblue" to "#483D8BFF",
      "darkslategray" to "#2F4F4FFF",
      "darkslategrey" to "#2F4F4FFF",
      "darkturquoise" to "#00CED1FF",
      "darkviolet" to "#9400D3FF",
      "deeppink" to "#FF1493FF",
      "deepskyblue" to "#00BFFFFF",
      "dimgray" to "#696969FF",
      "dimgrey" to "#696969FF",
      "dodgerblue" to "#1E90FFFF",
      "firebrick" to "#B22222FF",
      "floralwhite" to "#FFFAF0FF",
      "forestgreen" to "#228B22FF",
      "fuchsia" to "#FF00FFFF",
      "gainsboro" to "#DCDCDCFF",
      "ghostwhite" to "#F8F8FFFF",
      "gold" to "#FFD700FF",
      "goldenrod" to "#DAA520FF",
      "gray" to "#808080FF",
      "grey" to "#808080FF",
      "green" to "#008000FF",
      "greenyellow" to "#ADFF2FFF",
      "honeydew" to "#F0FFF0FF",
      "hotpink" to "#FF69B4FF",
      "indianred" to "#CD5C5CFF",
      "indigo" to "#4B0082FF",
      "ivory" to "#FFFFF0FF",
      "khaki" to "#F0E68CFF",
      "lavender" to "#E6E6FAFF",
      "lavenderblush" to "#FFF0F5FF",
      "lawngreen" to "#7CFC00FF",
      "lemonchiffon" to "#FFFACDFF",
      "lightblue" to "#ADD8E6FF",
      "lightcoral" to "#F08080FF",
      "lightcyan" to "#E0FFFFFF",
      "lightgoldenrodyellow" to "#FAFAD2FF",
      "lightgray" to "#D3D3D3FF",
      "lightgrey" to "#D3D3D3FF",
      "lightgreen" to "#90EE90FF",
      "lightpink" to "#FFB6C1FF",
      "lightsalmon" to "#FFA07AFF",
      "lightseagreen" to "#20B2AAFF",
      "lightskyblue" to "#87CEFAFF",
      "lightslategray" to "#778899FF",
      "lightslategrey" to "#778899FF",
      "lightsteelblue" to "#B0C4DEFF",
      "lightyellow" to "#FFFFE0FF",
      "lime" to "#00FF00FF",
      "limegreen" to "#32CD32FF",
      "linen" to "#FAF0E6FF",
      "magenta" to "#FF00FFFF",
      "maroon" to "#800000FF",
      "mediumaquamarine" to "#66CDAAFF",
      "mediumblue" to "#0000CDFF",
      "mediumorchid" to "#BA55D3FF",
      "mediumpurple" to "#9370D8FF",
      "mediumseagreen" to "#3CB371FF",
      "mediumslateblue" to "#7B68EEFF",
      "mediumspringgreen" to "#00FA9AFF",
      "mediumturquoise" to "#48D1CCFF",
      "mediumvioletred" to "#C71585FF",
      "midnightblue" to "#191970FF",
      "mintcream" to "#F5FFFAFF",
      "mistyrose" to "#FFE4E1FF",
      "moccasin" to "#FFE4B5FF",
      "navajowhite" to "#FFDEADFF",
      "navy" to "#000080FF",
      "oldlace" to "#FDF5E6FF",
      "olive" to "#808000FF",
      "olivedrab" to "#6B8E23FF",
      "orange" to "#FFA500FF",
      "orangered" to "#FF4500FF",
      "orchid" to "#DA70D6FF",
      "palegoldenrod" to "#EEE8AAFF",
      "palegreen" to "#98FB98FF",
      "paleturquoise" to "#AFEEEEFF",
      "palevioletred" to "#D87093FF",
      "papayawhip" to "#FFEFD5FF",
      "peachpuff" to "#FFDAB9FF",
      "peru" to "#CD853FFF",
      "pink" to "#FFC0CBFF",
      "plum" to "#DDA0DDFF",
      "powderblue" to "#B0E0E6FF",
      "purple" to "#800080FF",
      "rebeccapurple" to "#663399FF",
      "red" to "#FF0000FF",
      "rosybrown" to "#BC8F8FFF",
      "royalblue" to "#4169E1FF",
      "saddlebrown" to "#8B4513FF",
      "salmon" to "#FA8072FF",
      "sandybrown" to "#F4A460FF",
      "seagreen" to "#2E8B57FF",
      "seashell" to "#FFF5EEFF",
      "sienna" to "#A0522DFF",
      "silver" to "#C0C0C0FF",
      "skyblue" to "#87CEEBFF",
      "slateblue" to "#6A5ACDFF",
      "slategray" to "#708090FF",
      "slategrey" to "#708090FF",
      "snow" to "#FFFAFAFF",
      "springgreen" to "#00FF7FFF",
      "steelblue" to "#4682B4FF",
      "tan" to "#D2B48CFF",
      "teal" to "#008080FF",
      "thistle" to "#D8BFD8FF",
      "tomato" to "#FF6347FF",
      "turquoise" to "#40E0D0FF",
      "violet" to "#EE82EEFF",
      "wheat" to "#F5DEB3FF",
      "white" to "#FFFFFFFF",
      "whitesmoke" to "#F5F5F5FF",
      "yellow" to "#FFFF00FF",
      "yellowgreen" to "#9ACD32FF",
    )

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
