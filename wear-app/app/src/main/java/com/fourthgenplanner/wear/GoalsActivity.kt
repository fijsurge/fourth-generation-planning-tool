package com.fourthgenplanner.wear

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

// ---------- Status helpers — colors live in Theme.kt (WatchTheme.*) ----------

private fun statusBg(s: String) = when (s) {
    "complete"    -> WatchTheme.StatusCompleteBg
    "in_progress" -> WatchTheme.StatusInProgressBg
    else          -> WatchTheme.StatusNotStartedBg
}

private fun statusFg(s: String) = when (s) {
    "complete"    -> WatchTheme.StatusCompleteFg
    "in_progress" -> WatchTheme.StatusInProgressFg
    else          -> WatchTheme.StatusNotStartedFg
}

private fun statusIcon(s: String) = when (s) {
    "complete"    -> "✓"
    "in_progress" -> "◑"
    else          -> "○"
}

// ---------- Activity ----------

class GoalsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Optional: launched from a role chip with a filter, or from a "View All" entry point
        val roleFilter = intent.getStringExtra("roleFilter")
        setContent {
            MaterialTheme {
                GoalsScreen(context = this, roleFilter = roleFilter)
            }
        }
    }
}

// ---------- Screen ----------

@Composable
fun GoalsScreen(context: Context, roleFilter: String? = null) {
    val allGoals = remember { loadGoalsFromPrefs(context) }

    // activeFilter can be toggled to null to show all roles from within a filtered view
    val activeFilter = remember { mutableStateOf(roleFilter) }

    // Filter based on activeFilter (can be toggled to null to show all)
    val goals = remember(activeFilter.value) {
        val f = activeFilter.value
        if (f != null)
            allGoals.filter { if (f == "Other") it.roleName.isEmpty() else it.roleName == f }
        else
            allGoals
    }

    val statusMap = remember {
        val overrides = loadStatusOverrides(context)
        mutableStateMapOf<String, String>().also { map ->
            allGoals.forEach { g -> map[g.id] = effectiveStatus(g, overrides) }
        }
    }

    // When filtered to one role, always group by quadrant (Q1/Q2 headers).
    // When showing all roles, let the user toggle role vs quadrant.
    val groupByRole = remember {
        mutableStateOf(
            if (roleFilter != null) false
            else context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getBoolean(KEY_GROUP_BY_ROLE, false)
        )
    }

    val listState = rememberScalingLazyListState()

    Scaffold(
        vignette = { Vignette(vignettePosition = VignettePosition.TopAndBottom) },
        positionIndicator = { PositionIndicator(scalingLazyListState = listState) }
    ) {
        ScalingLazyColumn(
            state = listState,
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Title: role name when filtered, otherwise app title
            item {
                Text(
                    text = activeFilter.value ?: "Goals This Week",
                    color = WatchTheme.Text,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }

            // When in a filtered role view, show "← All Roles" to expand back
            if (activeFilter.value != null) {
                item {
                    Chip(
                        onClick = {
                            activeFilter.value = null
                            groupByRole.value = false
                        },
                        colors = ChipDefaults.chipColors(backgroundColor = WatchTheme.SurfaceElevated),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        label = {
                            Text(
                                text = "← All Roles",
                                color = WatchTheme.Text,
                                fontSize = 12.sp
                            )
                        }
                    )
                }
            }

            // Show role/quadrant toggle only in the "all goals" view
            if (activeFilter.value == null) {
                item {
                    Chip(
                        onClick = {
                            val next = !groupByRole.value
                            groupByRole.value = next
                            context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                                .edit().putBoolean(KEY_GROUP_BY_ROLE, next).apply()
                        },
                        colors = ChipDefaults.chipColors(backgroundColor = WatchTheme.ToggleBg),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        label = {
                            Text(
                                text = if (groupByRole.value) "◈  View by Quadrant" else "◈  View by Role",
                                color = WatchTheme.ToggleFg,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    )
                }
            }

            if (goals.isEmpty()) {
                item {
                    Text(
                        text = "No goals found.",
                        color = WatchTheme.SectionLabel,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                }
            } else {
                // Build sections based on current grouping.
                // We carry the quadrant int alongside the label so we can color
                // section headers per-quadrant (Q2 in cyan = framework hero).
                val sections: List<Triple<String, Int?, List<GoalItem>>> = if (groupByRole.value && activeFilter.value == null) {
                    goals
                        .groupBy { it.roleName.ifEmpty { "Other" } }
                        .entries
                        .sortedBy { it.key }
                        .map { Triple(it.key, null, it.value) }
                } else {
                    // Group by quadrant; for single-role view this shows Q1 / Q2 headers
                    goals
                        .groupBy { it.quadrant }
                        .entries
                        .sortedBy { it.key }
                        .map { Triple(qLabel(it.key), it.key, it.value) }
                }

                for ((sectionTitle, sectionQuadrant, sectionGoals) in sections) {
                    item {
                        Text(
                            text = sectionTitle,
                            color = sectionQuadrant?.let { quadrantColor(it) } ?: WatchTheme.SectionLabel,
                            fontSize = 11.sp,
                            fontWeight = if (sectionQuadrant == 2) FontWeight.Bold else FontWeight.Medium,
                            modifier = Modifier.padding(top = 6.dp, bottom = 2.dp)
                        )
                    }
                    for (goal in sectionGoals) {
                        item(key = goal.id) {
                            GoalChip(
                                goal = goal,
                                status = statusMap[goal.id] ?: "not_started",
                                onTap = {
                                    val current = statusMap[goal.id] ?: "not_started"
                                    val next = cycleStatus(current)
                                    statusMap[goal.id] = next
                                    CoroutineScope(Dispatchers.IO).launch {
                                        saveStatusOverride(context, goal.id, next)
                                        sendStatusUpdateToPhone(context, goal.id, next)
                                        requestTileRefresh(context)
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun qLabel(q: Int) = when (q) {
    1 -> "Q1 — Important & Urgent"
    2 -> "Q2 — Important, Not Urgent"
    else -> "Q$q"
}

// ---------- Goal chip ----------

@Composable
fun GoalChip(goal: GoalItem, status: String, onTap: () -> Unit) {
    Chip(
        onClick = onTap,
        colors = ChipDefaults.chipColors(backgroundColor = statusBg(status)),
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 2.dp),
        label = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = statusIcon(status),
                    color = statusFg(status),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(end = 6.dp)
                )
                if (goal.isBigRock) {
                    Text(
                        text = "◆ ",
                        color = WatchTheme.BigRock,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    text = goal.text,
                    color = if (status == "complete")
                        statusFg(status).copy(alpha = 0.75f)
                    else
                        statusFg(status),
                    fontSize = 13.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    )
}
