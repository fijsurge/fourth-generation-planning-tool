# Session Context - February 19, 2026

## Project Status
- **Phase 1**: COMPLETE - `f996829`
- **Phase 2**: COMPLETE - `b11aa99`
- **Phase 3**: COMPLETE - `137fc29`
- **Phase 4**: COMPLETE - `1d2fcb5`
- **Phase 5**: COMPLETE - `84b5c64` + follow-up commits
- **Phase 6** (Microsoft/Outlook): DEFERRED (company policy unclear)
- **Dark Mode**: COMPLETE - `d031164`
- **Move/Copy Goals Between Weeks**: COMPLETE - `379d844`
- **Stats Tab + Weekly Closeout Checkpoint**: COMPLETE — `ffd21a1`
- **Role Color Coding for Calendar Events**: COMPLETE — `b967d1c`
- **Auto Version Bump**: COMPLETE — `f61a616` (pre-commit hook)
- **Logo in Tab Header**: COMPLETE — `0a2fda7`
- **Android OAuth Fix**: COMPLETE — `893f141`, `b52e6cf`, `ccd91b6`
- **Native Date Picker**: COMPLETE — `0c89c86`

## Current app.json version: 1.0.10

## What's Been Built (additions since last session)

### Auto Version Bump (pre-commit hook)
- `scripts/bump-version.js` — increments patch version in app.json, stages it
- `scripts/pre-commit` — git pre-commit hook that calls bump-version.js
- `package.json` — `npm run setup-hooks` copies hook to `.git/hooks/pre-commit`
- **Important**: pre-push amend approach was tried first and caused permanent
  local/remote divergence. Pre-commit is the correct approach.

### Logo in Tab Header
- `app/(tabs)/_layout.tsx` — `headerLeft` added to shared screenOptions
- Single black PNG (`fourth_gen_v1_black_fg_trans_bg.png`) + `tintColor`
  switching between `#000` (light) and `#FFF` (dark) via `useSettings()`
- tintColor approach used because the white PNG files don't have true
  transparency (they have a white background despite the filename)

### Android OAuth Fix
- Root cause: `fourthgenplanner://` rejected by Google (no domain); Android
  didn't handle `com.googleusercontent.apps.{id}:/oauth2redirect` (no intent filter)
- Fix 1 (`893f141`): `src/auth/google.ts` — Android uses reverse client ID
  URI via `makeRedirectUri({ native: 'com.googleusercontent.apps.{id}:/oauth2redirect' })`
- Fix 2 (`b52e6cf`): `app.config.js` — dynamic config reads
  `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` at build time and injects intent
  filter into AndroidManifest so Android routes the redirect to the app
- Fix 3 (`ccd91b6`): `app/oauth2redirect.tsx` — new route that matches the
  path Expo Router sees; calls `WebBrowser.maybeCompleteAuthSession()`;
  waits for `isLoggedIn` then navigates to `/(tabs)/weekly-plan`
- `app/_layout.tsx` — registers `oauth2redirect` screen (headerShown: false)

### Native Date Picker (`0c89c86`)
- `src/components/DateTimePickerField.tsx`:
  - `DateTimePickerField` — for non-all-day events (date + time)
    - Android: date dialog → time dialog sequentially
    - iOS: bottom-sheet modal with inline `mode="datetime"` picker
    - Web: delegates to WebDateTimePicker (unchanged)
  - `DatePickerField` — for all-day events (date only)
    - Android: single date dialog
    - iOS: bottom-sheet modal with inline `mode="date"` picker
    - Web: `<input type="date">` (unchanged)
- `app/event/new.tsx` + `app/event/[id].tsx` — replaced TextInput fallbacks
  with DateTimePickerField / DatePickerField
- Package added: `@react-native-community/datetimepicker`

## Architecture Notes
- Roles state: shared via RolesContext (`src/contexts/RolesContext.tsx`)
- CalendarEvents state: shared via CalendarEventsContext (same pattern)
- Settings/theme state: shared via SettingsContext (`src/contexts/SettingsContext.tsx`)
- Theme: `useThemeColors()` hook reads from SettingsContext, returns appropriate palette
- All StyleSheet.create() calls are inside components wrapped in useMemo([colors])
- Color constants (quadrant/status) use factory functions accepting ColorPalette
- WeeklyReflection: NOT in a shared context (fetched per-hook)
- `app.config.js` extends `app.json` via function export pattern — bump-version.js
  continues to update version in app.json as before

## Key Decisions
- Google Sheets as sole data store (no backend)
- Client-side OAuth with PKCE
- Optimistic updates with rollback on error
- Default quadrant = Q2 (Covey's emphasis on "important but not urgent")
- Alert.alert for native, window.confirm for web delete confirmations
- Android OAuth uses Android client type (reverse client ID scheme), not web client
  (Google rejects custom schemes like fourthgenplanner:// for web clients)

## Environment Notes
- Windows (MINGW64), Node 24.13.0, npm 11.6.2
- CRLF warnings on git commits (cosmetic, not a problem)
- Port 8081 default; kill lingering Expo via `netstat -ano | grep 8081` + `taskkill`
- Expo SDK 54 project needs `babel-preset-expo` as devDep once babel.config.js exists
