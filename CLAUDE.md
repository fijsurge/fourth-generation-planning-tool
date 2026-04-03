# Fourth Generation Planning Tool — Claude Instructions

## Deployment: Wireless ADB (preferred)

Always build and deploy to devices wirelessly via ADB. Never suggest USB or EAS cloud builds.

**ADB location:** `D:/Android/Sdk/platform-tools/adb.exe`

**Device IPs (stable on home WiFi):**
- Phone: `192.168.86.29`
- Pixel Watch 4: `192.168.86.33`

**Ports change each session** — the user provides them. Connect before installing:
```bash
"D:/Android/Sdk/platform-tools/adb.exe" connect 192.168.86.29:<PORT>
"D:/Android/Sdk/platform-tools/adb.exe" connect 192.168.86.33:<PORT>
```

### Build + deploy phone APK
```bash
cd android && ./gradlew assembleDebug --no-daemon
"D:/Android/Sdk/platform-tools/adb.exe" -s 192.168.86.29:<PORT> install -r app/build/outputs/apk/debug/app-debug.apk
```

### Build + deploy watch APK
```bash
cd wear-app && ./gradlew assembleDebug --no-daemon
"D:/Android/Sdk/platform-tools/adb.exe" -s 192.168.86.33:<PORT> install -r app/build/outputs/apk/debug/app-debug.apk
```

### After `npx expo prebuild --platform android`
These manual fixes are always required (see memory for details):
1. `debuggableVariants = []` in `android/app/build.gradle` react block
2. OAuth redirect scheme: `com.googleusercontent.apps.454227728256-pu6m0ps4l03pd503nvcu7hj8kahncn29`
3. `ndk { abiFilters "armeabi-v7a" }` in `android/app/build.gradle` defaultConfig
4. Wearable + coroutines deps in `android/app/build.gradle` dependencies
