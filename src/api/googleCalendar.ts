import { CalendarEvent, EventAttendee, EventTransparency } from "../models/CalendarEvent";

const CALENDAR_BASE =
  "https://www.googleapis.com/calendar/v3/calendars/primary";

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
    throw new Error(`Google Calendar API error (${res.status}): ${body}`);
  }
  return res;
}

// ─── Mapping helpers ──────────────────────────────────────

function googleEventToCalendarEvent(item: any): CalendarEvent {
  const allDay = !!item.start?.date;
  const attendees: EventAttendee[] | undefined = item.attendees?.map(
    (a: any) => ({
      email: a.email,
      responseStatus: a.responseStatus,
    })
  );
  return {
    id: item.id,
    source: "google",
    title: item.summary || "(No title)",
    description: item.description || "",
    startTime: allDay ? item.start.date : item.start.dateTime,
    endTime: allDay ? item.end.date : item.end.dateTime,
    allDay,
    attendees,
    transparency: (item.transparency as EventTransparency) || "opaque",
    colorId: item.colorId || undefined,
  };
}

function calendarEventToGoogleBody(event: Partial<CalendarEvent>) {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const body: any = {};

  if (event.title !== undefined) body.summary = event.title;
  if (event.description !== undefined) body.description = event.description;

  if (event.startTime !== undefined && event.endTime !== undefined) {
    if (event.allDay) {
      body.start = { date: event.startTime };
      body.end = { date: event.endTime };
    } else {
      body.start = { dateTime: event.startTime, timeZone };
      body.end = { dateTime: event.endTime, timeZone };
    }
  }

  if (event.attendees !== undefined) {
    body.attendees = event.attendees.map((a) => ({ email: a.email }));
  }
  if (event.transparency !== undefined) {
    body.transparency = event.transparency;
  }
  if (event.colorId !== undefined) {
    body.colorId = event.colorId;
  }

  return body;
}

export async function getEvent(
  accessToken: string,
  eventId: string
): Promise<CalendarEvent> {
  const res = await apiFetch(
    `${CALENDAR_BASE}/events/${eventId}`,
    accessToken
  );
  const data = await res.json();
  return googleEventToCalendarEvent(data);
}

// ─── CRUD ─────────────────────────────────────────────────

export async function listEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const res = await apiFetch(
    `${CALENDAR_BASE}/events?${params}`,
    accessToken
  );
  const data = await res.json();
  return (data.items || []).map(googleEventToCalendarEvent);
}

export async function createEvent(
  accessToken: string,
  event: Omit<CalendarEvent, "id" | "source">
): Promise<CalendarEvent> {
  const body = calendarEventToGoogleBody(event);
  const res = await apiFetch(`${CALENDAR_BASE}/events`, accessToken, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return googleEventToCalendarEvent(data);
}

export async function updateEvent(
  accessToken: string,
  eventId: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const body = calendarEventToGoogleBody(event);
  const res = await apiFetch(
    `${CALENDAR_BASE}/events/${eventId}`,
    accessToken,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    }
  );
  const data = await res.json();
  return googleEventToCalendarEvent(data);
}

export async function deleteEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  await apiFetch(`${CALENDAR_BASE}/events/${eventId}`, accessToken, {
    method: "DELETE",
  });
}
