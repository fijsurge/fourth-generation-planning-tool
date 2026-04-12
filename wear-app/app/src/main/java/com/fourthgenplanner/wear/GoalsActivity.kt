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

// ---------- Status colour tokens ----------
private val BgNotStarted = Color(0xFF2D2D2D)
private val FgNotStarted = Color(0xFFABABAB)
private val BgInProgress = Color(0xFF1A3050)
private val FgInProgress = Color(0xFF90CAF9)
private val BgComplete   = Color(0xFF1A3B1F)
private val FgComplete   = Color(0xFF81C784)
private val BgToggle     = Color(0xFF2E7D32)
private val FgToggle     = Color(0xFFFFFFFF)
private val FgSection    = Color(0xFFAAAAAA)
private val FgBigRock    = Color(0xFFF59E0B) // amber

private fun statusBg(s: String) = when (s) {
    "complete"    -> BgComplete
    "in_progress" -> BgInProgress
    else          -> BgNotStarted
}

private fun statusFg(s: String) = when (s) {
    "complete"    -> FgComplete
    "in_progress" -> FgInProgress
    else          -> FgNotStarted
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
                    color = Color.White,
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
                        colors = ChipDefaults.chipColors(backgroundColor = Color(0xFF3A3A3A)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        label = {
                            Text(
                                text = "← All Roles",
                                color = Color(0xFFE0E0E0),
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
                        colors = ChipDefaults.chipColors(backgroundColor = BgToggle),
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        label = {
                            Text(
                                text = if (groupByRole.value) "◈  View by Quadrant" else "◈  View by Role",
                                color = FgToggle,
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
                        color = FgSection,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(top = 12.dp)
                    )
                }
            } else {
                // Build sections based on current grouping
                val sections: List<Pair<String, List<GoalItem>>> = if (groupByRole.value && activeFilter.value == null) {
                    goals
                        .groupBy { it.roleName.ifEmpty { "Other" } }
                        .entries
                        .sortedBy { it.key }
                        .map { it.key to it.value }
                } else {
                    // Group by quadrant; for single-role view this shows Q1 / Q2 headers
                    goals
                        .groupBy { it.quadrant }
                        .entries
                        .sortedBy { it.key }
                        .map { qLabel(it.key) to it.value }
                }

                for ((sectionTitle, sectionGoals) in sections) {
                    item {
                        Text(
                            text = sectionTitle,
                            color = FgSection,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium,
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
                        color = FgBigRock,
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
