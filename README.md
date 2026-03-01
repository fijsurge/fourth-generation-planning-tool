# Fourth Generation Planning Tool

A weekly planning app based on Stephen Covey's fourth-generation time management framework from *The 7 Habits of Highly Effective People*. Organize your life around **roles**, set **weekly goals** for each role, classify them by **Covey Quadrant** (I-IV), and **schedule big rocks** directly to Google Calendar.
 
## Features

- **Weekly Planning** — Set goals for each of your life roles, navigate between weeks, track progress
- **Covey Quadrant Matrix** — 2x2 grid view showing goals by urgency/importance, with Q2 emphasis
- **Google Calendar Integration** — View, create, edit, and delete calendar events; link goals to events
- **Role Management** — Create and manage life roles (e.g. Individual, Manager, Parent), activate/deactivate as needed
- **Status Tracking** — Cycle goals through Not Started, In Progress, and Complete
- **Dark Mode** — Light/Dark theme toggle with preference persisted across sessions
- **Google Sheets Storage** — All data stored in your own Google Sheets spreadsheet (no backend server)
- **Cross-Platform** — Runs on web, iOS, and Android from a single codebase

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + Expo Router |
| Language | TypeScript |
| Auth | expo-auth-session (Google OAuth with PKCE) |
| Data Store | Google Sheets API (REST) |
| Calendar | Google Calendar API (REST) |
| Calendar UI | react-native-big-calendar |
| Date Utils | date-fns |
| Token Storage | expo-secure-store (mobile) / localStorage (web) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Google Cloud project with OAuth credentials and these APIs enabled:
  - Google Sheets API
  - Google Calendar API
  - Google Drive API

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/fijsurge/fourth-generation-planning-tool.git
   cd fourth-generation-planning-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Google OAuth credentials:
   ```
   EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your-web-client-id>
   EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=<your-web-client-secret>
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS=<your-ios-client-id>
   EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=<your-android-client-id>
   ```
   The client ID and secret are found in **Google Cloud Console → APIs & Services → Credentials** under your Web OAuth 2.0 client. Also ensure `http://localhost:8081` is listed under both **Authorized JavaScript origins** and **Authorized redirect URIs** for local testing.

4. Start the development server:
   ```bash
   npx expo start --web
   ```
   If you see a `Body is unusable` error on startup, add the `--offline` flag to skip Expo's version-check network call:
   ```bash
   npx expo start --web --offline
   ```

## Building

### Android (local — requires Android Studio)

1. Generate / sync the native Android project:
   ```bash
   npx expo prebuild --platform android
   ```

2. Build the APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   The APK is output to `android/app/build/outputs/apk/debug/app-debug.apk`.

   For a release build use `assembleRelease` instead.

### Android (cloud — via EAS)

```bash
# Preview APK (sideloadable)
npx eas build --platform android --profile preview

# Production AAB (for Google Play)
npx eas build --platform android --profile production
```

### Web

```bash
npx expo export --platform web
```

## Project Structure

```
app/                        # Expo Router file-based routes
  (tabs)/                   # Bottom tab navigation
    weekly-plan.tsx         # Main weekly planning screen
    quadrant.tsx            # 2x2 Covey matrix view
    calendar.tsx            # Calendar with Day/Week/Month views
    settings.tsx            # Roles, theme, calendar settings
  goal/                     # Goal create/edit screens
  role/                     # Role create/edit screens
  event/                    # Calendar event create/edit screens
  login.tsx                 # Google sign-in
src/
  api/                      # Google Sheets + Calendar API clients
  auth/                     # OAuth config, token storage, AuthContext
  components/               # Reusable UI components
  contexts/                 # React contexts (Roles, CalendarEvents, Settings)
  hooks/                    # Custom hooks (useRoles, useWeeklyGoals, useCalendarEvents)
  models/                   # TypeScript types (Role, WeeklyGoal, CalendarEvent)
  theme/                    # Colors (light/dark palettes), spacing, useThemeColors hook
  utils/                    # Date helpers, constants, UUID generator
```

## Data Storage

Data is stored in a Google Sheets spreadsheet called **"Fourth Generation Planner"** with three sheets:

- **Roles** — Life roles with name, description, sort order, active status
- **WeeklyGoals** — Goals linked to a role and week, with quadrant classification and status
- **Settings** — Key-value pairs for preferences (e.g., theme mode)

The spreadsheet is auto-created on first sign-in.

## License

MIT
