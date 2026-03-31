package com.fourthgenplanner.wear

import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.tiles.ResourceBuilders
import androidx.wear.protolayout.TimelineBuilders.*
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.SettableFuture
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import org.json.JSONArray

private const val RESOURCES_VERSION = "1"

data class GoalItem(val text: String, val quadrant: Int)

class WearTileService : TileService() {

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest
    ): ListenableFuture<TileBuilders.Tile> {
        val future = SettableFuture.create<TileBuilders.Tile>()
        CoroutineScope(Dispatchers.IO).launch {
            val goals = loadGoals()
            future.set(buildTile(goals))
        }
        return future
    }

    override fun onResourcesRequest(
        requestParams: RequestBuilders.ResourcesRequest
    ): ListenableFuture<ResourceBuilders.Resources> =
        Futures.immediateFuture(
            ResourceBuilders.Resources.Builder()
                .setVersion(RESOURCES_VERSION)
                .build()
        )

    private suspend fun loadGoals(): List<GoalItem> = withContext(Dispatchers.IO) {
        try {
            val dataItems = Wearable.getDataClient(this@WearTileService)
                .getDataItems(android.net.Uri.parse("wear://*/goals/current"))
                .await()

            val goals = mutableListOf<GoalItem>()
            for (item in dataItems) {
                val dataMap = DataMapItem.fromDataItem(item).dataMap
                val json = dataMap.getString("goals_json") ?: continue
                val array = JSONArray(json)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    goals.add(GoalItem(obj.getString("text"), obj.getInt("quadrant")))
                }
            }
            dataItems.release()
            goals.sortedBy { it.quadrant }.take(6)
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun buildTile(goals: List<GoalItem>): TileBuilders.Tile {
        val timeline = Timeline.Builder()
            .addTimelineEntry(
                TimelineEntry.Builder()
                    .setLayout(buildLayout(goals))
                    .build()
            )
            .build()

        return TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setTileTimeline(timeline)
            .setFreshnessIntervalMillis(30 * 60 * 1000L)
            .build()
    }

    private fun boldStyle(sizeSp: Float, colorArgb: Int): FontStyle =
        FontStyle.Builder()
            .setSize(sp(sizeSp))
            .setWeight(
                FontWeightProp.Builder()
                    .setValue(FONT_WEIGHT_BOLD)
                    .build()
            )
            .setColor(argb(colorArgb))
            .build()

    private fun normalStyle(sizeSp: Float, colorArgb: Int): FontStyle =
        FontStyle.Builder()
            .setSize(sp(sizeSp))
            .setColor(argb(colorArgb))
            .build()

    private fun buildLayout(goals: List<GoalItem>): Layout {
        val column = Column.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setHorizontalAlignment(HORIZONTAL_ALIGN_START)

        column.addContent(
            Text.Builder()
                .setText("This Week's Goals")
                .setFontStyle(boldStyle(14f, 0xFFFFFFFF.toInt()))
                .setMaxLines(1)
                .build()
        )
        column.addContent(Spacer.Builder().setHeight(dp(6f)).build())

        if (goals.isEmpty()) {
            column.addContent(
                Text.Builder()
                    .setText("No goals yet. Open the app to add some.")
                    .setFontStyle(normalStyle(12f, 0xFFAAAAAA.toInt()))
                    .setMaxLines(3)
                    .build()
            )
        } else {
            for (goal in goals) {
                val qColor = when (goal.quadrant) {
                    1 -> 0xFF4CAF50.toInt()
                    2 -> 0xFF2196F3.toInt()
                    else -> 0xFFAAAAAA.toInt()
                }
                column.addContent(
                    Row.Builder()
                        .setWidth(expand())
                        .addContent(
                            Text.Builder()
                                .setText("Q${goal.quadrant} ")
                                .setFontStyle(boldStyle(11f, qColor))
                                .setMaxLines(1)
                                .build()
                        )
                        .addContent(
                            Text.Builder()
                                .setText(goal.text)
                                .setFontStyle(normalStyle(11f, 0xFFDDDDDD.toInt()))
                                .setMaxLines(2)
                                .setOverflow(TEXT_OVERFLOW_ELLIPSIZE)
                                .build()
                        )
                        .build()
                )
                column.addContent(Spacer.Builder().setHeight(dp(3f)).build())
            }
        }

        return Layout.Builder()
            .setRoot(
                Box.Builder()
                    .setWidth(expand())
                    .setHeight(expand())
                    .setVerticalAlignment(VERTICAL_ALIGN_TOP)
                    .setHorizontalAlignment(HORIZONTAL_ALIGN_START)
                    .addContent(column.build())
                    .build()
            )
            .build()
    }
}
