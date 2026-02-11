# Fourth Generation Planning Tool - Implementation Plan

## Context

Build a personal weekly planning tool based on Stephen Covey's fourth-generation time management framework from "The 7 Habits of Highly Effective People." The tool centers on **roles** (life areas), **weekly goals** under each role, **Covey Quadrant classification** (I-IV), and **calendar integration** to schedule "big rocks" (Q2 activities). Data is stored in Google Sheets so no backend is needed. The app runs on web and mobile from a single Expo codebase.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Expo (SDK 52+) + Expo Router** | Single codebase for web, iOS, Android |
| Language | **TypeScript** | Type safety, good learning path |
| Auth | **expo-auth-session** (PKCE) | Handles Google + Microsoft OAuth without native modules |
| Data store | **Google Sheets API** (REST) | User's own Google account, no server needed |
| Google Calendar | **Google Calendar API** (REST) | Same OAuth token as Sheets |
| Outlook Calendar | **Microsoft Graph API** (REST) | Separate Microsoft OAuth via Entra ID |
| Token storage | **expo-secure-store** (mobile) / **localStorage** (web) | Platform-appropriate secure storage |
| Date utils | **date-fns** | Lightweight, tree-shakeable |
| Hosting (web) | **Vercel** (free tier) | Static SPA export, zero config |
| Mobile builds | **Expo Go** (dev) / **EAS Build** (prod) | Managed workflow, no Xcode/Android Studio needed initially |

---

## Project Structure

```
fourth-generation-planning-tool/
├── app/                           # Expo Router file-based routes
│   ├── _layout.tsx                # Root layout (AuthProvider, auth gate)
│   ├── index.tsx                  # Redirect to /login or /(tabs)
│   ├── login.tsx                  # Google + Microsoft sign-in
│   ├── (tabs)/
│   │   ├── _layout.tsx            # Bottom tab bar (4 tabs)
│   │   ├── weekly-plan.tsx        # Main weekly planning screen
│   │   ├── quadrant.tsx           # 2x2 Covey matrix view
│   │   ├── calendar.tsx           # Combined calendar view
│   │   └── settings.tsx           # Roles, accounts, preferences
│   ├── goal/
│   │   ├── new.tsx                # Create goal
│   │   └── [id].tsx               # Edit goal
│   ├── role/
│   │   ├── new.tsx                # Create role
│   │   └── [id].tsx               # Edit role
│   └── event/
│       └── new.tsx                # Create calendar event
├── src/
│   ├── auth/
│   │   ├── AuthContext.tsx         # React context for Google + Microsoft auth
│   │   ├── google.ts              # Google OAuth config
│   │   ├── microsoft.ts           # Microsoft OAuth config
│   │   └── tokenStorage.ts        # Platform-adaptive secure storage
│   ├── api/
│   │   ├── googleSheets.ts        # Sheets CRUD (roles, goals, settings)
│   │   ├── googleCalendar.ts      # Google Calendar read/write
│   │   └── outlookCalendar.ts     # Microsoft Graph Calendar read/write
│   ├── models/
│   │   ├── Role.ts
│   │   ├── WeeklyGoal.ts
│   │   ├── CalendarEvent.ts       # Unified type for both calendar sources
│   │   └── Settings.ts
│   ├── hooks/
│   │   ├── useRoles.ts
│   │   ├── useWeeklyGoals.ts
│   │   ├── useCalendarEvents.ts   # Merges Google + Outlook events
│   │   ├── useGoogleAuth.ts
│   │   └── useMicrosoftAuth.ts
│   ├── components/
│   │   ├── WeekSelector.tsx        # Navigate weeks
│   │   ├── GoalItem.tsx            # Goal row (text, quadrant badge, status badge)
│   │   ├── GoalsByRole.tsx         # Goals grouped under role header
│   │   ├── StatusBadge.tsx         # Tappable: Not Started -> In Progress -> Complete
│   │   ├── QuadrantBadge.tsx       # Colored Q1/Q2/Q3/Q4 label
│   │   ├── QuadrantGrid.tsx        # 2x2 matrix layout
│   │   ├── QuadrantCell.tsx        # Single quadrant cell
│   │   ├── RoleCard.tsx
│   │   ├── CalendarWeekView.tsx
│   │   ├── CalendarDayView.tsx
│   │   └── EventCard.tsx
│   ├── utils/
│   │   ├── dates.ts                # Week start/end helpers
│   │   ├── uuid.ts
│   │   └── constants.ts            # Quadrant labels/colors, status values
│   └── theme/
│       ├── colors.ts
│       └── spacing.ts
├── assets/
├── app.json
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

---

## Google Sheets Data Schema

Single spreadsheet named **"Fourth Generation Planner"** with 3 sheets:

### Roles sheet
| Col | Field | Example |
|-----|-------|---------|
| A | ID (UUID) | `a1b2c3d4` |
| B | Name | `Individual` |
| C | Description | `Personal development` |
| D | SortOrder | `1` |
| E | Active | `TRUE` |
| F | CreatedAt | `2026-02-11T10:00:00Z` |
| G | UpdatedAt | `2026-02-11T10:00:00Z` |

### WeeklyGoals sheet
| Col | Field | Example |
|-----|-------|---------|
| A | ID (UUID) | `e5f6g7h8` |
| B | WeekStartDate (Monday) | `2026-02-09` |
| C | RoleID (FK) | `a1b2c3d4` |
| D | GoalText | `Read 30 min daily` |
| E | Quadrant (1-4) | `2` |
| F | Status | `not_started` |
| G | Notes | `Leadership books` |
| H | CalendarEventID | optional |
| I | CalendarSource | `google` or `outlook` |
| J | CreatedAt | ISO datetime |
| K | UpdatedAt | ISO datetime |

### Settings sheet
| Col | Field | Example |
|-----|-------|---------|
| A | Key | `weekStartDay` |
| B | Value | `1` (Monday) |
| C | UpdatedAt | ISO datetime |

---

## Auth Flows

### Google (required - Sheets + Calendar)
- **Method**: `expo-auth-session` with PKCE, `useAutoDiscovery('https://accounts.google.com')`
- **Scopes**: `spreadsheets`, `calendar`, `calendar.events`, `drive.file`
- **Setup**: Google Cloud Console project with OAuth consent screen + client IDs (web, iOS, Android)
- **Tokens**: Access + refresh tokens stored in `tokenStorage.ts`

### Microsoft (optional - Outlook Calendar)
- **Method**: `expo-auth-session` with PKCE against `login.microsoftonline.com/common/oauth2/v2.0`
- **Scopes**: `Calendars.ReadWrite`, `User.Read`, `offline_access`
- **Setup**: Azure Portal / Entra ID app registration, enable "public client flows"
- **Note**: Using `/common` tenant supports both Work/School and personal accounts. User's IT admin may need to grant consent for Work/School accounts.

### Environment Variables (public client IDs, safe to embed)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (web)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS`
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID`
- `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`

---

## Phased Implementation

### Phase 1: Project Scaffold + Navigation
- Initialize Expo project with TypeScript
- Install dependencies: `expo-router`, `expo-auth-session`, `expo-web-browser`, `expo-secure-store`, `expo-crypto`, `date-fns`, `@expo/vector-icons`
- Configure `app.json` (scheme: `fourthgenplanner`, web bundler: metro)
- Set up all route files with placeholder screens
- Create TypeScript models (`Role`, `WeeklyGoal`, `CalendarEvent`, `Settings`)
- Create theme constants (colors, spacing)
- **Verify**: App runs on web + mobile emulator, 4 tabs navigable

### Phase 2: Google Auth + Sheets Integration
- Set up Google Cloud project (Sheets API, Calendar API, Drive API, OAuth credentials)
- Implement `tokenStorage.ts` (SecureStore on mobile, localStorage on web)
- Implement Google OAuth flow (`google.ts`, `AuthContext.tsx`)
- Build login screen with "Sign in with Google"
- Implement `googleSheets.ts` with all CRUD operations:
  - First-run: auto-create spreadsheet with headers
  - Read/add/update/delete for Roles and WeeklyGoals
  - Row lookup by scanning column A for ID match
- Implement `useRoles` and `useWeeklyGoals` hooks
- **Verify**: Sign in with Google, spreadsheet created in Drive, CRUD roles via app visible in Sheets

### Phase 3: Weekly Plan + Roles UI
- Build `StatusBadge` (gray/amber/green, tappable to cycle status)
- Build `QuadrantBadge` (Q1=red, Q2=blue, Q3=orange, Q4=gray)
- Build `GoalItem`, `GoalsByRole`, `WeekSelector`, `RoleCard`
- Implement **Weekly Plan** tab: WeekSelector + goals grouped by role + FAB to add goal
- Implement goal create/edit screens (role picker, text, quadrant selector, status, notes)
- Implement role create/edit screens in Settings tab
- Use optimistic updates: update local state immediately, write to Sheets in background
- **Verify**: Full role + goal CRUD, status cycling, week navigation, data persists in Sheets

### Phase 4: Quadrant Matrix View
- Build `QuadrantCell` and `QuadrantGrid` (2x2 layout)
- Implement **Quadrant** tab: WeekSelector + 2x2 grid with goals distributed by quadrant
- Visually emphasize Q2 cell (Covey's key insight: spend more time here)
- Tap goal to navigate to edit screen
- **Verify**: Goals appear in correct quadrant cells, Q2 is highlighted

### Phase 5: Google Calendar Integration
- Implement `googleCalendar.ts` (list, create, update, delete events via REST)
- Build `EventCard`, `CalendarDayView`, `CalendarWeekView`
- Implement **Calendar** tab: week view with Google Calendar events, FAB to add event
- Implement event create screen (title, date/time, description)
- Add "Schedule to Calendar" button on goal edit screen (creates event, links event ID back to goal)
- **Verify**: Real Google Calendar events shown, new events created from app appear in Google Calendar

### Phase 6: Microsoft OAuth + Outlook Calendar
- Register app in Azure Portal / Entra ID
- Implement Microsoft OAuth flow (`microsoft.ts`, update `AuthContext.tsx`)
- Add "Connect Microsoft" in Settings
- Implement `outlookCalendar.ts` (list, create, update, delete via Microsoft Graph)
- Update `useCalendarEvents` to merge Google + Outlook events (`Promise.all`)
- Color-code events by source on Calendar tab (Google=blue, Outlook=purple)
- Update event create screen with calendar source picker
- **Verify**: Outlook events appear alongside Google events, can create events in either calendar

---

## Key Architecture Decisions

1. **No backend server** - Client-side OAuth with PKCE, direct API calls to Google/Microsoft. Keeps it simple for a personal tool.
2. **Google Sheets as database** - Unconventional but meets the user's requirement. Works well for low-volume personal data. All rows loaded into memory per sheet, row lookups by ID scan.
3. **Optimistic updates** - UI updates instantly on user action; Sheets API write happens async. Reverts on failure.
4. **Unified CalendarEvent model** - Both calendar sources map to a common type so the UI layer is source-agnostic.
5. **Expo managed workflow** - No native module dependencies. Using `expo-auth-session` for both OAuth providers avoids ejecting.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| OAuth redirect URIs differ across web/iOS/Android | Test on all platforms in Phase 2; use `AuthSession.makeRedirectUri()` consistently |
| Google Sheets API rate limits | Cache data in-memory, batch reads (one per sheet), optimistic writes |
| M365 admin may block third-party apps | Document limitation; user can request IT admin consent |
| Token refresh failures | Wrap API calls to catch 401, refresh token, retry once; prompt re-login if refresh fails |
| Time zone handling | Store in UTC, display with `Intl.DateTimeFormat`; normalize both calendar APIs to UTC |

---

## Verification Plan

After each phase, verify by:
1. Running `npx expo start --web` and testing in browser
2. Running on mobile via Expo Go on phone
3. Checking Google Sheets in browser to confirm data writes
4. Checking Google Calendar / Outlook Calendar to confirm event creation
5. Testing the full flow: create role -> create goal -> classify quadrant -> change status -> schedule to calendar
