# Session Context - February 12, 2026

## Project Status
- **Phase 1**: COMPLETE - `f996829`
- **Phase 2**: COMPLETE - `b11aa99` (auth fixes included in Phase 3 commit)
- **Phase 3**: COMPLETE - `137fc29` — all pushed to remote
- **Phase 4**: NOT STARTED — Quadrant Matrix view
- **Phase 5**: NOT STARTED — Google Calendar integration
- **Phase 6** (Microsoft/Outlook): DEFERRED (company policy unclear)

## What's Built So Far

### Data Layer (Phase 2)
- Google OAuth with PKCE (redirect flow on web, popup on mobile)
- Token storage (SecureStore native, localStorage web) with auto-refresh
- Google Sheets CRUD: `src/api/googleSheets.ts` — auto-creates spreadsheet with Roles, WeeklyGoals, Settings sheets
- `useRoles()` and `useWeeklyGoals(weekKey)` hooks with optimistic updates
- Models: Role, WeeklyGoal, CalendarEvent, Settings in `src/models/`
- Theme: `src/theme/colors.ts`, `src/theme/spacing.ts`
- Utils: `src/utils/dates.ts` (week math), `src/utils/constants.ts` (quadrant/status labels+colors), `src/utils/uuid.ts`

### UI Layer (Phase 3)
7 components in `src/components/`:
- **StatusBadge** — Pressable pill, cycles not_started → in_progress → complete
- **QuadrantBadge** — Non-interactive colored pill (Q1-Q4)
- **WeekSelector** — Prev/next arrows + "Feb 10 - Feb 16, 2026" + "Today" link
- **RoleCard** — Pressable card with role name/description + chevron
- **GoalItem** — Row: goal text + QuadrantBadge + StatusBadge (tappable)
- **GoalsByRole** — Groups goals by role headers; deleted roles → "Unassigned"
- **WeeklySummary** — Stats bar: "4/6 complete — 3 Q2, 1 Q1"

6 screens rewritten:
- `app/(tabs)/weekly-plan.tsx` — WeekSelector (sticky), GoalsByRole (scroll), FAB (+)
- `app/(tabs)/settings.tsx` — Roles list, Add Role, Sign Out
- `app/goal/new.tsx` — Role chips, goal text, quadrant selector (default Q2), notes
- `app/goal/[id].tsx` — Same pre-filled + Delete
- `app/role/new.tsx` — Name + description
- `app/role/[id].tsx` — Same pre-filled + Delete

### Navigation Flow
```
weekly-plan → FAB → /goal/new?weekStartDate=YYYY-MM-DD
weekly-plan → goal tap → /goal/[id]?weekStartDate=YYYY-MM-DD
settings → role tap → /role/[id]
settings → Add Role → /role/new
All modals → Save/Delete → router.back()
```

## Not Yet Tested by User
Phase 3 UI compiles (tsc clean, Metro bundles) but hasn't been manually tested end-to-end yet. Verification checklist:
1. Create a role in Settings, verify it appears + persists in Google Sheet
2. Create a goal via FAB, verify it groups under the correct role
3. Cycle status badge (gray → amber → green), verify in Sheet
4. Edit/delete goal and role, verify CRUD
5. Navigate weeks, verify goals are week-scoped
6. Sign out and back in, verify data persists

## Key Decisions
- Google Sheets as sole data store (no backend)
- Client-side OAuth with PKCE
- Optimistic updates with rollback on error
- Week state owned by weekly-plan screen, passed as route param
- Default quadrant = Q2 (Covey's emphasis on "important but not urgent")
- useRoles called independently per screen (no shared context)
- useFocusEffect refreshes data when returning from modals
- Alert.alert for native, window.confirm for web delete confirmations

## Next Up: Phase 4 — Quadrant Matrix View
Per `.claude/plan.md`, Phase 4 builds a 2x2 grid view showing goals organized by quadrant. The `app/(tabs)/quadrant.tsx` screen is currently a placeholder.

## Environment Notes
- Windows (MINGW64), Node 24.13.0, npm 11.6.2
- CRLF warnings on git commits (cosmetic, not a problem)
- Port 8081 default; use `--port 8082` if occupied by lingering Expo process
