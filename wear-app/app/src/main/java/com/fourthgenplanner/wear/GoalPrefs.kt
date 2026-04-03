package com.fourthgenplanner.wear

import android.content.Context
import androidx.wear.tiles.TileService
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.tasks.await
import org.json.JSONArray
import org.json.JSONObject

// ---------- SharedPreferences keys ----------

const val PREFS_NAME = "tile_prefs"
const val KEY_GROUP_BY_ROLE = "groupByRole"
const val KEY_GOALS_JSON = "goals_json"
const val KEY_STATUS_OVERRIDES = "status_overrides"

// ---------- Data model ----------

data class GoalItem(
    val id: String,
    val text: String,
    val quadrant: Int,
    val roleName: String,
    val status: String   // "not_started" | "in_progress" | "complete"
)

val STATUS_CYCLE_LIST = listOf("not_started", "in_progress", "complete")

// ---------- Goals cache ----------

fun saveGoalsToPrefs(context: Context, json: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().putString(KEY_GOALS_JSON, json).apply()
}

fun loadGoalsFromPrefs(context: Context): List<GoalItem> {
    val json = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(KEY_GOALS_JSON, "[]") ?: "[]"
    return parseGoalsJson(json)
}

fun parseGoalsJson(json: String): List<GoalItem> = try {
    val arr = JSONArray(json)
    (0 until arr.length()).map { i ->
        arr.getJSONObject(i).let { o ->
            GoalItem(
                id = o.optString("id", ""),
                text = o.optString("text", ""),
                quadrant = o.optInt("quadrant", 1),
                roleName = o.optString("roleName", ""),
                status = o.optString("status", "not_started")
            )
        }
    }.sortedWith(compareBy({ it.quadrant }, { it.roleName }))
} catch (e: Exception) {
    emptyList()
}

// ---------- Status overrides ----------

fun loadStatusOverrides(context: Context): Map<String, String> {
    val json = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .getString(KEY_STATUS_OVERRIDES, "{}") ?: "{}"
    return try {
        val obj = JSONObject(json)
        obj.keys().asSequence().associateWith { obj.getString(it) }
    } catch (e: Exception) {
        emptyMap()
    }
}

fun saveStatusOverride(context: Context, goalId: String, status: String) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val current = loadStatusOverrides(context).toMutableMap()
    current[goalId] = status
    prefs.edit().putString(KEY_STATUS_OVERRIDES, JSONObject(current as Map<*, *>).toString()).apply()
}

/**
 * After the phone pushes new goals, clear any watch-side overrides where the
 * phone has already caught up (i.e. the server-side status now matches the override).
 */
fun clearMatchedOverrides(context: Context, updatedGoals: List<GoalItem>) {
    val overrides = loadStatusOverrides(context).toMutableMap()
    val serverStatus = updatedGoals.associateBy({ it.id }, { it.status })
    overrides.entries.removeAll { (id, override) -> serverStatus[id] == override }
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        .edit().putString(KEY_STATUS_OVERRIDES, JSONObject(overrides as Map<*, *>).toString()).apply()
}

// ---------- Helpers ----------

fun effectiveStatus(goal: GoalItem, overrides: Map<String, String>): String =
    overrides[goal.id]?.takeIf { it.isNotEmpty() } ?: goal.status

fun cycleStatus(current: String): String {
    val idx = STATUS_CYCLE_LIST.indexOf(current).coerceAtLeast(0)
    return STATUS_CYCLE_LIST[(idx + 1) % STATUS_CYCLE_LIST.size]
}

// ---------- DataLayer message → phone ----------

suspend fun sendStatusUpdateToPhone(context: Context, goalId: String, newStatus: String) {
    try {
        val nodes = Wearable.getNodeClient(context).connectedNodes.await()
        val nodeId = nodes.firstOrNull()?.id ?: return
        val json = JSONObject().apply {
            put("id", goalId)
            put("status", newStatus)
        }.toString()
        Wearable.getMessageClient(context)
            .sendMessage(nodeId, "/goals/statusUpdate", json.toByteArray())
            .await()
    } catch (e: Exception) {
        android.util.Log.w("GoalPrefs", "Status update to phone failed: ${e.message}")
    }
}

fun requestTileRefresh(context: Context) {
    TileService.getUpdater(context).requestUpdate(WearTileService::class.java)
}
