package com.fourthgenplanner.wear

import androidx.compose.ui.graphics.Color

/**
 * FourthGen Planner — watch design tokens.
 *
 * Mirrors the dark palette in `src/theme/colors.ts` from the phone app.
 * Wear OS is always dark so we don't model a light variant.
 *
 * Keep this file in sync with the phone palette by hand. If the two
 * design systems drift, reconcile here. Known drift points so far:
 *   - Status "in_progress" was blue (#1A3050 / #90CAF9); now amber (#F5C842)
 *     to match the phone where in_progress = amber, complete = cyan.
 *   - Big Rock was #F59E0B (light-mode amber); now #FFB547 (slightly warmer
 *     dark-mode variant) so it sits naturally on a dark watch face.
 *
 * Compose-friendly: every value is a `Color`. For Tiles (which need ARGB
 * ints), use `.toArgb()` at the call site.
 */
object WatchTheme {

    // ---- Surfaces / chrome ---------------------------------------------------
    val Background       = Color(0xFF06091A)  // matches phone dark background
    val Surface          = Color(0xFF0E1435)
    val SurfaceElevated  = Color(0xFF141B40)

    // ---- Text ---------------------------------------------------------------
    val Text             = Color(0xFFE8ECF8)  // primary text on dark
    val TextSecondary    = Color(0xFF8E92A8)  // ~ 55% alpha E8ECF8 baked over bg
    val TextMuted        = Color(0xFF50546B)  // ~ 30% alpha   "

    // ---- Brand / primary (Q2) -----------------------------------------------
    val Primary          = Color(0xFF00E6C8)  // cyan — phone primary in dark
    val OnPrimary        = Color(0xFF080C22)

    // ---- Big Rocks ----------------------------------------------------------
    val BigRock          = Color(0xFFFFB547)

    // ---- Quadrants (foreground colors) --------------------------------------
    val Q1               = Color(0xFFFF6B6B)
    val Q2               = Color(0xFF00E6C8)  // hero — same as primary
    val Q3               = Color(0xFF6A9AFF)
    val Q4               = Color(0xFF8A93AB)  // muted slate, NOT faded blue

    // Quadrant tinted backgrounds for chips / accents
    val Q1Bg             = Color(0xFF3D1F1F)
    val Q2Bg             = Color(0xFF0A3531)  // slightly stronger so Q2 stands out
    val Q3Bg             = Color(0xFF1A2640)
    val Q4Bg             = Color(0xFF2D3140)

    // ---- Goal status --------------------------------------------------------
    val StatusNotStartedFg = Color(0xFFABABAB)
    val StatusInProgressFg = Color(0xFFF5C842)  // amber (was light blue)
    val StatusCompleteFg   = Color(0xFF00E6C8)  // cyan (matches Q2/primary)

    val StatusNotStartedBg = Color(0xFF2D2D2D)
    val StatusInProgressBg = Color(0xFF3D2E0A)  // dark amber tint (was dark blue)
    val StatusCompleteBg   = Color(0xFF0A3531)  // dark teal tint (matches Q2Bg)

    // ---- Toggle / chrome buttons -------------------------------------------
    val ToggleBg         = Color(0xFF0A3D38)  // dark cyan tint (was dark green)
    val ToggleFg         = Color(0xFF00E6C8)

    // Section/header labels
    val SectionLabel     = Color(0xFF8E92A8)
}

/**
 * Quadrant-by-int helper.
 */
fun quadrantColor(q: Int): Color = when (q) {
    1 -> WatchTheme.Q1
    2 -> WatchTheme.Q2
    3 -> WatchTheme.Q3
    4 -> WatchTheme.Q4
    else -> WatchTheme.TextMuted
}

fun quadrantBg(q: Int): Color = when (q) {
    1 -> WatchTheme.Q1Bg
    2 -> WatchTheme.Q2Bg
    3 -> WatchTheme.Q3Bg
    4 -> WatchTheme.Q4Bg
    else -> WatchTheme.StatusNotStartedBg
}
