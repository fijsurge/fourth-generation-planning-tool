package com.fourthgenplanner.app

import com.facebook.react.bridge.*
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.*
import kotlinx.coroutines.tasks.await

class WearDataModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "WearDataModule"

    @ReactMethod
    fun pushGoalsToWatch(goalsJson: String, promise: Promise) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val request = PutDataMapRequest.create("/goals/current").apply {
                    dataMap.putString("goals_json", goalsJson)
                    dataMap.putLong("updated_at", System.currentTimeMillis())
                }
                val putRequest = request.asPutDataRequest().setUrgent()
                Wearable.getDataClient(reactApplicationContext)
                    .putDataItem(putRequest)
                    .await()
                withContext(Dispatchers.Main) { promise.resolve(null) }
            } catch (e: Exception) {
                // Silently resolve — watch may not be connected
                withContext(Dispatchers.Main) { promise.resolve(null) }
            }
        }
    }
}
