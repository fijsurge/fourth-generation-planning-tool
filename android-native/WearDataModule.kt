package com.fourthgenplanner.app

import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.tasks.await

class WearDataModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("WearDataModule")

        // AsyncFunction runs on a background thread; runBlocking is safe here.
        AsyncFunction("pushGoalsToWatch") { goalsJson: String ->
            runBlocking {
                try {
                    val context = appContext.reactContext ?: return@runBlocking
                    val request = PutDataMapRequest.create("/goals/current").apply {
                        dataMap.putString("goals_json", goalsJson)
                        dataMap.putLong("updated_at", System.currentTimeMillis())
                    }
                    Wearable.getDataClient(context)
                        .putDataItem(request.asPutDataRequest().setUrgent())
                        .await()
                    android.util.Log.d("WearDataModule", "Goals pushed to watch successfully")
                } catch (e: Exception) {
                    android.util.Log.w("WearDataModule", "Push failed (watch may not be connected): ${e.message}")
                    // Silent fail — watch may not be paired
                }
            }
        }
    }
}
