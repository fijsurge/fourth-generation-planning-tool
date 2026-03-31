package com.fourthgenplanner.wear

import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.WearableListenerService

/**
 * Receives goal data pushed from the phone app via Wearable DataLayer,
 * then requests a tile refresh so the tile shows up-to-date goals.
 */
class WearListenerService : WearableListenerService() {

    override fun onDataChanged(dataEvents: DataEventBuffer) {
        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED &&
                event.dataItem.uri.path == "/goals/current"
            ) {
                TileService.getUpdater(this)
                    .requestUpdate(WearTileService::class.java)
            }
        }
    }
}
