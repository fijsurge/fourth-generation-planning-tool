package com.fourthgenplanner.wear

import android.app.Activity
import android.os.Bundle
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/**
 * Launched by a tile goal chip tap.
 * Reads the goal ID from Intent extras, cycles its status in SharedPreferences,
 * sends the update to the phone via DataLayer, requests a tile refresh, then exits.
 *
 * This activity is transparent and exits immediately, so the user never sees it.
 */
class CycleStatusActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val goalId = intent.getStringExtra("goalId")
        if (goalId.isNullOrEmpty()) {
            finish()
            return
        }

        val goals = loadGoalsFromPrefs(this)
        val overrides = loadStatusOverrides(this)
        val goal = goals.find { it.id == goalId }
        if (goal == null) {
            finish()
            return
        }

        val currentStatus = effectiveStatus(goal, overrides)
        val newStatus = cycleStatus(currentStatus)

        // Save locally and refresh tile immediately (sync, before network call)
        saveStatusOverride(this, goalId, newStatus)
        requestTileRefresh(this)

        // Send to phone async, then exit
        CoroutineScope(Dispatchers.IO).launch {
            sendStatusUpdateToPhone(this@CycleStatusActivity, goalId, newStatus)
            withContext(Dispatchers.Main) { finish() }
        }
    }
}
