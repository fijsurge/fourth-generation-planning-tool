# Session Context - February 21, 2026

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
- **v1.1.0 Minor Release (7 features)**: COMPLETE — `d840e77`

## Current app.json version: 1.1.0

## v1.1.0 Release — What Was Built

### Feature 1: Calendar Icon on Date/Time Picker Buttons
- `src/components/DateTimePickerField.tsx` — added Ionicons `calendar-outline`
  icon to all Android + iOS picker buttons (both DateTimePickerField and
  DatePickerField). Web branches unchanged.

### Feature 2: Conflict Detection on Event Scheduling
- `app/event/new.tsx` + `app/event/[id].tsx` — debounced (600ms) conflict check
  using `listEvents` directly. Advisory-only: red banner for busy overlaps, amber
  for free-status overlaps. Save button always enabled.
- **Bug fixed**: ISO string comparison fails when Google Calendar returns
  timezone-offset strings (e.g. `+10:00`) vs UTC `Z` strings. Must use
  `new Date(str).getTime()` numeric comparison. `[id].tsx` also excludes
  `e.id !== id` to avoid self-conflict.

### Feature 3: Swipe-to-Delete Goals
- `src/components/GoalsByRole.tsx` — `SwipeableGoalRow` inner component (not
  exported) owns its own `useRef<Swipeable>`. Red 80px delete panel on swipe.
  Native only (`Platform.OS !== "web" && !isLocked`).
- `src/components/GoalItem.tsx` — `onDelete?` prop; web-only trash icon renders
  when `onDelete && !isLocked && Platform.OS === "web"`.
- `app/(tabs)/weekly-plan.tsx` — `handleDeleteGoal` callback, `onDeleteGoal`
  prop passed to GoalsByRole.

### Feature 4: Loading Skeletons + Better Empty States
- `src/components/GoalsByRole.tsx` — `isLoading?` prop; renders shimmer skeleton
  (reanimated withRepeat/withSequence) when loading. Empty state updated with
  calendar icon + "Tap + to plan your most important work." hint.
- `src/components/QuadrantCell.tsx` — replaced "No goals" text with
  `add-circle-outline` Ionicons icon.

### Feature 5: Recurring Goals
- **Sheets schema**: `WeeklyGoals` cols L/M/N — `Recurring` / `RecurringEnds` /
  `RecurringRemaining`
- `src/models/WeeklyGoal.ts` — `recurring?`, `recurringEnds?`, `recurringRemaining?`
- `src/api/googleSheets.ts` — goalToRow/rowToGoal updated for cols L–N
- `app/goal/new.tsx` + `app/goal/[id].tsx` — Switch + segmented end-type control
  (No end / End by date / End after N weeks). Date uses `DatePickerField`.
  Count uses a +/− stepper (`recurringCount` is `number` state, not string).
- `app/(tabs)/weekly-plan.tsx` — auto-carry logic: runs once per weekKey
  (carriedWeekRef guard), fetches last week's recurring goals, deduplicates,
  creates copies with decremented recurringRemaining. Toast banner on carry.

### Feature 6: Weekly Reflection Improvements
- **Sheets schema**: `WeeklyReflections` col H — `WeekRating` (1–5 integer)
- `src/models/WeeklyReflection.ts` — `weekRating?: number | null`
- `src/api/googleSheets.ts` — reflectionToRow/rowToReflection updated for col H
- `src/components/CloseoutModal.tsx` — 5-star rating UI, stats summary (N of M
  goals complete), updated TextInput placeholders.
- `app/(tabs)/stats.tsx` — star display row in expanded reflection sections.

### Feature 7: Local Notifications for Q2 Goals
- Package: `expo-notifications`
- `src/notifications/scheduler.ts` — `requestPermission`, `cancelAllScheduled`,
  `scheduleWeeklyQ2Reminders`. Weekly Monday repeating notification with Q2
  goal bullet list. All functions guard Platform.OS !== "web".
- `app/_layout.tsx` — Android notification channel `q2-reminders` on mount.
- `src/contexts/SettingsContext.tsx` — `notificationsEnabled` / `notificationTime`
  state, loaded from Sheets, exposed via context.
- `app/(tabs)/settings.tsx` — Notifications section (native only): toggle +
  HH:mm time input.
- `app/(tabs)/weekly-plan.tsx` — schedules on goals/settings change.

### Post-release fixes (same commit)
- `DatePickerField` web branch: removed `width: "100%"` from input style and
  wrapped in flex div, so it looks compact and consistent with `WebDateTimePicker`
  (event scheduler) rather than stretching full-width like a text field.
- `recurringCount` in `goal/[id].tsx` changed from `string` to `number` state;
  stepper UI replaces TextInput (matches `goal/new.tsx`).

### Auto-versioning update
- `scripts/bump-version.js` — now skips patch bump if version in working tree
  differs from HEAD in ANY way (not just major/minor). Enables setting an explicit
  version (e.g. 1.1.0) and having it committed as-is.

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
- Conflict detection is advisory-only — save button never blocked by conflicts

## Environment Notes
- Windows (MINGW64), Node 24.13.0, npm 11.6.2
- CRLF warnings on git commits (cosmetic, not a problem)
- Port 8081 default; kill lingering Expo via `netstat -ano | grep 8081` + `taskkill`
- Expo SDK 54 project needs `babel-preset-expo` as devDep once babel.config.js exists
