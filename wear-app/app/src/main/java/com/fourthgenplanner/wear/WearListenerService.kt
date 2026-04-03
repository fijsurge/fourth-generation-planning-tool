package com.fourthgenplanner.wear

import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.WearableListenerService

/**
 * Receives goal data pushed from the phone app via Wearable DataLayer.
 * Caches the goals in SharedPreferences (for fast access in GoalsActivity),
 * clears any watch-side overrides that the phone has already applied,
 * then requests a tile refresh.
 */
class WearListenerService : WearableListenerService() {

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED &&
                event.dataItem.uri.path == "/goals/current"
            ) {
                val dataMap = DataMapItem.fromDataItem(event.dataItem).dataMap
                val json = dataMap.getString("goals_json") ?: continue

                // Cache for GoalsActivity and tile status-merge
                saveGoalsToPrefs(this, json)

                // Clear overrides the phone has already incorporated
                val updatedGoals = parseGoalsJson(json)
                clearMatchedOverrides(this, updatedGoals)

                TileService.getUpdater(this)
                    .requestUpdate(WearTileService::class.java)
            }
        }
    }
}
