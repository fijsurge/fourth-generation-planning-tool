package com.fourthgenplanner.wear

import android.app.Activity
import android.os.Bundle
import androidx.wear.tiles.TileService

/**
 * Launched by the tile's toggle button.
 * Flips the groupByRole preference and requests a tile refresh, then exits immediately.
 */
class ToggleGroupActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val prefs = getSharedPreferences("tile_prefs", MODE_PRIVATE)
        val current = prefs.getBoolean("groupByRole", false)
        prefs.edit().putBoolean("groupByRole", !current).apply()
        TileService.getUpdater(this).requestUpdate(WearTileService::class.java)
        finish()
    }
}
