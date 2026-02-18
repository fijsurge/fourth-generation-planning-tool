import { Role } from "../models/Role";
import { WeeklyGoal } from "../models/WeeklyGoal";
import { WeeklyReflection } from "../models/WeeklyReflection";
import { SettingsEntry } from "../models/Settings";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const DRIVE_BASE = "https://www.googleapis.com/drive/v3/files";
const SPREADSHEET_TITLE = "Fourth Generation Planner";

// Sheet names
const ROLES_SHEET = "Roles";
const GOALS_SHEET = "WeeklyGoals";
const SETTINGS_SHEET = "Settings";
const REFLECTIONS_SHEET = "WeeklyReflections";
const REFLECTIONS_HEADERS = [
  "ID",
  "WeekStartDate",
  "WentWell",
  "DidntGoWell",
  "Intentions",
  "CreatedAt",
  "UpdatedAt",
];
let reflectionsSheetEnsured = false;

// Header rows
const ROLES_HEADERS = [
  "ID",
  "Name",
  "Description",
  "SortOrder",
  "Active",
  "CreatedAt",
  "UpdatedAt",
];
const GOALS_HEADERS = [
  "ID",
  "WeekStartDate",
  "RoleID",
  "GoalText",
  "Quadrant",
  "Status",
  "Notes",
  "CalendarEventID",
  "CalendarSource",
  "CreatedAt",
  "UpdatedAt",
];
const SETTINGS_HEADERS = ["Key", "Value", "UpdatedAt"];

let cachedSpreadsheetId: string | null = null;

// ─── Helpers ───────────────────────────────────────────────

async function apiFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google API error (${res.status}): ${body}`);
  }
  return res;
}

// ─── Spreadsheet Discovery / Creation ──────────────────────

/**
 * Find or create the planner spreadsheet. Returns the spreadsheet ID.
 */
export async function getOrCreateSpreadsheet(
  accessToken: string
): Promise<string> {
  if (cachedSpreadsheetId) return cachedSpreadsheetId;

  // Search for existing spreadsheet
  const query = `name='${SPREADSHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`;
  const searchRes = await apiFetch(
    `${DRIVE_BASE}?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    accessToken
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    cachedSpreadsheetId = searchData.files[0].id;
    return cachedSpreadsheetId!;
  }

  // Create new spreadsheet with 4 sheets
  const createRes = await apiFetch(SHEETS_BASE, accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: { title: SPREADSHEET_TITLE },
      sheets: [
        { properties: { title: ROLES_SHEET } },
        { properties: { title: GOALS_SHEET } },
        { properties: { title: SETTINGS_SHEET } },
        { properties: { title: REFLECTIONS_SHEET } },
      ],
    }),
  });
  const createData = await createRes.json();
  cachedSpreadsheetId = createData.spreadsheetId;

  // Add header rows
  await apiFetch(
    `${SHEETS_BASE}/${cachedSpreadsheetId}/values:batchUpdate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        valueInputOption: "RAW",
        data: [
          { range: `${ROLES_SHEET}!A1`, values: [ROLES_HEADERS] },
          { range: `${GOALS_SHEET}!A1`, values: [GOALS_HEADERS] },
          { range: `${SETTINGS_SHEET}!A1`, values: [SETTINGS_HEADERS] },
          { range: `${REFLECTIONS_SHEET}!A1`, values: [REFLECTIONS_HEADERS] },
        ],
      }),
    }
  );

  return cachedSpreadsheetId!;
}

// ─── Generic Read / Write ──────────────────────────────────

async function readSheet(
  accessToken: string,
  sheetName: string
): Promise<string[][]> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const res = await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
    accessToken
  );
  const data = await res.json();
  // Skip header row (index 0)
  return (data.values || []).slice(1);
}

async function appendRow(
  accessToken: string,
  sheetName: string,
  row: string[]
): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ values: [row] }),
    }
  );
}

async function findRowIndex(
  accessToken: string,
  sheetName: string,
  id: string
): Promise<number> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const res = await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A:A`,
    accessToken
  );
  const data = await res.json();
  const rows: string[][] = data.values || [];
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === id) return i + 1; // 1-indexed for Sheets API
  }
  throw new Error(`Row with ID "${id}" not found in ${sheetName}`);
}

async function updateRow(
  accessToken: string,
  sheetName: string,
  rowIndex: number,
  row: string[]
): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
      sheetName
    )}!A${rowIndex}?valueInputOption=RAW`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({ values: [row] }),
    }
  );
}

async function deleteRow(
  accessToken: string,
  sheetName: string,
  id: string
): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  const rowIndex = await findRowIndex(accessToken, sheetName, id);

  // Get the sheet ID (not the spreadsheet ID)
  const res = await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`,
    accessToken
  );
  const data = await res.json();
  const sheet = data.sheets.find(
    (s: any) => s.properties.title === sheetName
  );
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

  await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}:batchUpdate`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: "ROWS",
                startIndex: rowIndex - 1, // 0-indexed for batchUpdate
                endIndex: rowIndex,
              },
            },
          },
        ],
      }),
    }
  );
}

// ─── Roles CRUD ────────────────────────────────────────────

function roleToRow(role: Role): string[] {
  return [
    role.id,
    role.name,
    role.description,
    String(role.sortOrder),
    String(role.active),
    role.createdAt,
    role.updatedAt,
  ];
}

function rowToRole(row: string[]): Role {
  return {
    id: row[0],
    name: row[1],
    description: row[2] || "",
    sortOrder: Number(row[3]) || 0,
    active: row[4] !== "false",
    createdAt: row[5] || "",
    updatedAt: row[6] || "",
  };
}

export async function getRoles(accessToken: string): Promise<Role[]> {
  const rows = await readSheet(accessToken, ROLES_SHEET);
  return rows.map(rowToRole);
}

export async function addRole(
  accessToken: string,
  role: Role
): Promise<void> {
  await appendRow(accessToken, ROLES_SHEET, roleToRow(role));
}

export async function updateRole(
  accessToken: string,
  role: Role
): Promise<void> {
  const rowIndex = await findRowIndex(accessToken, ROLES_SHEET, role.id);
  await updateRow(accessToken, ROLES_SHEET, rowIndex, roleToRow(role));
}

export async function deleteRole(
  accessToken: string,
  roleId: string
): Promise<void> {
  await deleteRow(accessToken, ROLES_SHEET, roleId);
}

// ─── WeeklyGoals CRUD ──────────────────────────────────────

function goalToRow(goal: WeeklyGoal): string[] {
  return [
    goal.id,
    goal.weekStartDate,
    goal.roleId,
    goal.goalText,
    String(goal.quadrant),
    goal.status,
    goal.notes,
    goal.calendarEventId || "",
    goal.calendarSource || "",
    goal.createdAt,
    goal.updatedAt,
  ];
}

function rowToGoal(row: string[]): WeeklyGoal {
  return {
    id: row[0],
    weekStartDate: row[1],
    roleId: row[2],
    goalText: row[3] || "",
    quadrant: (Number(row[4]) || 2) as 1 | 2 | 3 | 4,
    status: (row[5] as WeeklyGoal["status"]) || "not_started",
    notes: row[6] || "",
    calendarEventId: row[7] || undefined,
    calendarSource: row[8]
      ? (row[8] as WeeklyGoal["calendarSource"])
      : undefined,
    createdAt: row[9] || "",
    updatedAt: row[10] || "",
  };
}

export async function getWeeklyGoals(
  accessToken: string
): Promise<WeeklyGoal[]> {
  const rows = await readSheet(accessToken, GOALS_SHEET);
  return rows.map(rowToGoal);
}

export async function getWeeklyGoalsByWeek(
  accessToken: string,
  weekStartDate: string
): Promise<WeeklyGoal[]> {
  const allGoals = await getWeeklyGoals(accessToken);
  return allGoals.filter((g) => g.weekStartDate === weekStartDate);
}

export async function addWeeklyGoal(
  accessToken: string,
  goal: WeeklyGoal
): Promise<void> {
  await appendRow(accessToken, GOALS_SHEET, goalToRow(goal));
}

export async function updateWeeklyGoal(
  accessToken: string,
  goal: WeeklyGoal
): Promise<void> {
  const rowIndex = await findRowIndex(accessToken, GOALS_SHEET, goal.id);
  await updateRow(accessToken, GOALS_SHEET, rowIndex, goalToRow(goal));
}

export async function deleteWeeklyGoal(
  accessToken: string,
  goalId: string
): Promise<void> {
  await deleteRow(accessToken, GOALS_SHEET, goalId);
}

// ─── Settings CRUD ─────────────────────────────────────────

export async function getSettings(
  accessToken: string
): Promise<SettingsEntry[]> {
  const rows = await readSheet(accessToken, SETTINGS_SHEET);
  return rows.map((row) => ({
    key: row[0],
    value: row[1] || "",
    updatedAt: row[2] || "",
  }));
}

export async function setSetting(
  accessToken: string,
  key: string,
  value: string
): Promise<void> {
  const now = new Date().toISOString();
  try {
    const rowIndex = await findRowIndex(accessToken, SETTINGS_SHEET, key);
    await updateRow(accessToken, SETTINGS_SHEET, rowIndex, [
      key,
      value,
      now,
    ]);
  } catch {
    // Key doesn't exist yet, append it
    await appendRow(accessToken, SETTINGS_SHEET, [key, value, now]);
  }
}

// ─── WeeklyReflections CRUD ────────────────────────────────

async function ensureReflectionsSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  if (reflectionsSheetEnsured) return;

  const res = await apiFetch(
    `${SHEETS_BASE}/${spreadsheetId}?fields=sheets.properties`,
    accessToken
  );
  const data = await res.json();
  const exists = data.sheets.some(
    (s: any) => s.properties.title === REFLECTIONS_SHEET
  );

  if (!exists) {
    // Add the sheet
    await apiFetch(`${SHEETS_BASE}/${spreadsheetId}:batchUpdate`, accessToken, {
      method: "POST",
      body: JSON.stringify({
        requests: [{ addSheet: { properties: { title: REFLECTIONS_SHEET } } }],
      }),
    });
    // Write headers to A1
    await apiFetch(
      `${SHEETS_BASE}/${spreadsheetId}/values/${encodeURIComponent(
        REFLECTIONS_SHEET
      )}!A1?valueInputOption=RAW`,
      accessToken,
      {
        method: "PUT",
        body: JSON.stringify({ values: [REFLECTIONS_HEADERS] }),
      }
    );
  }

  reflectionsSheetEnsured = true;
}

function reflectionToRow(r: WeeklyReflection): string[] {
  return [
    r.id,
    r.weekStartDate,
    r.wentWell,
    r.didntGoWell,
    r.intentions,
    r.createdAt,
    r.updatedAt,
  ];
}

function rowToReflection(row: string[]): WeeklyReflection {
  return {
    id: row[0] || "",
    weekStartDate: row[1] || "",
    wentWell: row[2] || "",
    didntGoWell: row[3] || "",
    intentions: row[4] || "",
    createdAt: row[5] || "",
    updatedAt: row[6] || "",
  };
}

export async function getReflections(
  accessToken: string
): Promise<WeeklyReflection[]> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  await ensureReflectionsSheet(accessToken, spreadsheetId);
  const rows = await readSheet(accessToken, REFLECTIONS_SHEET);
  return rows.map(rowToReflection);
}

export async function getReflectionByWeek(
  accessToken: string,
  weekStartDate: string
): Promise<WeeklyReflection | null> {
  const all = await getReflections(accessToken);
  return all.find((r) => r.weekStartDate === weekStartDate) ?? null;
}

export async function addReflection(
  accessToken: string,
  reflection: WeeklyReflection
): Promise<void> {
  const spreadsheetId = await getOrCreateSpreadsheet(accessToken);
  await ensureReflectionsSheet(accessToken, spreadsheetId);
  await appendRow(accessToken, REFLECTIONS_SHEET, reflectionToRow(reflection));
}

export async function updateReflection(
  accessToken: string,
  reflection: WeeklyReflection
): Promise<void> {
  const rowIndex = await findRowIndex(
    accessToken,
    REFLECTIONS_SHEET,
    reflection.id
  );
  await updateRow(
    accessToken,
    REFLECTIONS_SHEET,
    rowIndex,
    reflectionToRow(reflection)
  );
}

export async function deleteReflection(
  accessToken: string,
  reflectionId: string
): Promise<void> {
  await deleteRow(accessToken, REFLECTIONS_SHEET, reflectionId);
}
