package com.fourthgenplanner.wear

import androidx.wear.protolayout.ActionBuilders
import androidx.wear.protolayout.ColorBuilders.argb
import androidx.wear.protolayout.DeviceParametersBuilders
import androidx.wear.protolayout.DimensionBuilders.*
import androidx.wear.protolayout.LayoutElementBuilders.*
import androidx.wear.protolayout.ModifiersBuilders.*
import androidx.wear.protolayout.TimelineBuilders.*
import androidx.wear.protolayout.material.Chip
import androidx.wear.protolayout.material.ChipColors
import androidx.wear.tiles.EventBuilders
import androidx.wear.tiles.RequestBuilders
import androidx.wear.tiles.ResourceBuilders
import androidx.wear.tiles.TileBuilders
import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.DataClient
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import com.google.common.util.concurrent.SettableFuture
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await
import org.json.JSONArray

private const val RESOURCES_VERSION = "5"
private const val MAX_ROLE_CHIPS = 4
private const val H_PADDING_DP = 12   // matches column left/right padding
private const val CHIP_GAP_DP  = 4

class WearTileService : TileService() {

    private val dataListener = DataClient.OnDataChangedListener { dataEvents ->
        for (event in dataEvents) {
            if (event.type == DataEvent.TYPE_CHANGED &&
                event.dataItem.uri.path == "/goals/current"
            ) {
                TileService.getUpdater(this@WearTileService)
                    .requestUpdate(WearTileService::class.java)
            }
        }
    }

    override fun onTileEnterEvent(requestParams: EventBuilders.TileEnterEvent) {
        Wearable.getDataClient(this).addListener(dataListener)
    }

    override fun onTileLeaveEvent(requestParams: EventBuilders.TileLeaveEvent) {
        Wearable.getDataClient(this).removeListener(dataListener)
    }

    override fun onTileRequest(
        requestParams: RequestBuilders.TileRequest
    ): ListenableFuture<TileBuilders.Tile> {
        val future = SettableFuture.create<TileBuilders.Tile>()
        val deviceParams = requestParams.deviceConfiguration
            ?: DeviceParametersBuilders.DeviceParameters.Builder()
                .setScreenWidthDp(192).setScreenHeightDp(192).setScreenDensity(2f).build()

        CoroutineScope(Dispatchers.IO).launch {
            val goals = loadGoalsFromDataLayer()
            val resolved = goals.ifEmpty { loadGoalsFromPrefs(this@WearTileService) }
            val overrides = loadStatusOverrides(this@WearTileService)
            future.set(buildTile(resolved, overrides, deviceParams))
        }
        return future
    }

    override fun onResourcesRequest(
        requestParams: RequestBuilders.ResourcesRequest
    ): ListenableFuture<ResourceBuilders.Resources> =
        Futures.immediateFuture(
            ResourceBuilders.Resources.Builder().setVersion(RESOURCES_VERSION).build()
        )

    // ---------- Data ----------

    private suspend fun loadGoalsFromDataLayer(): List<GoalItem> = withContext(Dispatchers.IO) {
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
                    goals.add(GoalItem(
                        id       = obj.optString("id", ""),
                        text     = obj.optString("text", ""),
                        quadrant = obj.optInt("quadrant", 1),
                        roleName = obj.optString("roleName", ""),
                        status   = obj.optString("status", "not_started")
                    ))
                }
            }
            dataItems.release()
            goals
        } catch (e: Exception) {
            emptyList()
        }
    }

    // ---------- Tile ----------

    private fun buildTile(
        goals: List<GoalItem>,
        overrides: Map<String, String>,
        deviceParams: DeviceParametersBuilders.DeviceParameters
    ): TileBuilders.Tile {
        val timeline = Timeline.Builder()
            .addTimelineEntry(
                TimelineEntry.Builder()
                    .setLayout(buildLayout(goals, overrides, deviceParams))
                    .build()
            )
            .build()
        val freshnessMs = if (goals.isEmpty()) 2 * 60 * 1000L else 30 * 60 * 1000L
        return TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setTileTimeline(timeline)
            .setFreshnessIntervalMillis(freshnessMs)
            .build()
    }

    private fun buildLayout(
        goals: List<GoalItem>,
        overrides: Map<String, String>,
        deviceParams: DeviceParametersBuilders.DeviceParameters
    ): Layout {
        // Half-chip width for 2-column grid
        val halfChipDp = (deviceParams.screenWidthDp - H_PADDING_DP * 2 - CHIP_GAP_DP) / 2f

        val column = Column.Builder()
            .setWidth(expand())
            .setHeight(expand())
            .setHorizontalAlignment(HORIZONTAL_ALIGN_CENTER)
            .setModifiers(Modifiers.Builder()
                .setPadding(Padding.Builder()
                    .setTop(dp(28f)).setBottom(dp(16f))
                    .setStart(dp(H_PADDING_DP.toFloat()))
                    .setEnd(dp(H_PADDING_DP.toFloat()))
                    .build())
                .build())

        // Header
        column.addContent(
            Text.Builder()
                .setText("Goals This Week")
                .setFontStyle(FontStyle.Builder()
                    .setSize(sp(14f))
                    .setWeight(FontWeightProp.Builder().setValue(FONT_WEIGHT_BOLD).build())
                    .setColor(argb(0xFFFFFFFF.toInt()))
                    .build())
                .setMaxLines(1)
                .build()
        )
        column.addContent(Spacer.Builder().setHeight(dp(8f)).build())

        if (goals.isEmpty()) {
            column.addContent(
                Text.Builder()
                    .setText("Open the phone app to sync goals.")
                    .setFontStyle(FontStyle.Builder()
                        .setSize(sp(12f))
                        .setColor(argb(0xFFAAAAAA.toInt()))
                        .build())
                    .setMaxLines(3)
                    .build()
            )
        } else {
            // Top roles by goal count, up to 4
            val topRoles = goals
                .groupBy { it.roleName.ifEmpty { "Other" } }
                .entries
                .sortedByDescending { it.value.size }
                .take(MAX_ROLE_CHIPS)

            // Render in pairs (2-column grid)
            val rows = topRoles.chunked(2)
            for (rowRoles in rows) {
                val row = Row.Builder()
                    .setWidth(expand())
                    .setVerticalAlignment(VERTICAL_ALIGN_CENTER)

                for ((idx, entry) in rowRoles.withIndex()) {
                    if (idx > 0) row.addContent(
                        Spacer.Builder().setWidth(dp(CHIP_GAP_DP.toFloat())).build()
                    )
                    val (roleName, roleGoals) = entry
                    val completed = roleGoals.count { effectiveStatus(it, overrides) == "complete" }
                    val total = roleGoals.size
                    val fraction = completed.toFloat() / total

                    val colors = when {
                        fraction >= 1f -> ChipColors(argb(0xFF1A3B1F.toInt()), argb(0xFF81C784.toInt()))
                        fraction > 0f  -> ChipColors(argb(0xFF1A3050.toInt()), argb(0xFF90CAF9.toInt()))
                        else           -> ChipColors(argb(0xFF2D2D2D.toInt()), argb(0xFFCCCCCC.toInt()))
                    }

                    val chipWidth = if (rowRoles.size == 1) expand() else dp(halfChipDp)

                    val clickable = Clickable.Builder()
                        .setId("role_${roleName.take(16).replace(" ", "_")}")
                        .setOnClick(ActionBuilders.LaunchAction.Builder()
                            .setAndroidActivity(ActionBuilders.AndroidActivity.Builder()
                                .setClassName("com.fourthgenplanner.wear.GoalsActivity")
                                .setPackageName("com.fourthgenplanner.app")
                                .addKeyToExtraMapping(
                                    "roleFilter",
                                    ActionBuilders.AndroidStringExtra.Builder()
                                        .setValue(roleName).build()
                                )
                                .build())
                            .build())
                        .build()

                    row.addContent(
                        Chip.Builder(this, clickable, deviceParams)
                            .setWidth(chipWidth)
                            .setPrimaryLabelContent(roleName)
                            .setSecondaryLabelContent("$completed / $total done")
                            .setChipColors(colors)
                            .build()
                    )
                }

                column.addContent(row.build())
                column.addContent(Spacer.Builder().setHeight(dp(4f)).build())
            }
        }

        return Layout.Builder().setRoot(column.build()).build()
    }
}
