import { EVENT_TYPES } from "../types.ts";

const allowedInputKeys = new Set([
  "title",
  "event_date",
  "start_time",
  "end_time",
  "class_name",
  "section",
  "description",
  "event_type",
]);

export class CalendarEventServiceError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "CalendarEventServiceError";
  }
}

export type CalendarEventInput = {
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  class_name?: string;
  section?: string;
  description?: string;
  event_type?: (typeof EVENT_TYPES)[number];
};

export type AccessibleClass = {
  id: string;
  name: string;
  section: string | null;
  subject_id: string;
};

export type CalendarEventInsert = {
  ai_tool_call_id: string;
  title: string;
  description: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  class_id: string | null;
  subject_id: string | null;
  event_type: (typeof EVENT_TYPES)[number];
};

export interface CalendarEventRepository {
  listAccessibleActiveClasses(): Promise<AccessibleClass[]>;
  insertCalendarEvent(values: CalendarEventInsert): Promise<unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isEventType(value: unknown): value is (typeof EVENT_TYPES)[number] {
  return typeof value === "string" && (EVENT_TYPES as readonly string[]).includes(value);
}

function parseOptionalString(
  input: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  const value = input[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new CalendarEventServiceError(400, "invalid_event", `${key} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new CalendarEventServiceError(400, "invalid_event", `${key} is too long.`);
  }
  return trimmed;
}

export function parseCalendarEventInput(value: unknown): CalendarEventInput {
  if (!isRecord(value)) {
    throw new CalendarEventServiceError(400, "invalid_event", "An event object is required.");
  }

  if (Object.keys(value).some((key) => !allowedInputKeys.has(key))) {
    throw new CalendarEventServiceError(
      400,
      "invalid_event",
      "The event contains unsupported fields.",
    );
  }

  const title = parseOptionalString(value, "title", 200);
  if (!title) {
    throw new CalendarEventServiceError(400, "invalid_event", "A title is required.");
  }

  const eventDate = value["event_date"];
  if (typeof eventDate !== "string" || !isValidDate(eventDate)) {
    throw new CalendarEventServiceError(
      400,
      "invalid_event",
      "event_date must be a real calendar date in YYYY-MM-DD format.",
    );
  }

  const startTime = parseOptionalString(value, "start_time", 5);
  const endTime = parseOptionalString(value, "end_time", 5);
  const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (startTime !== undefined && !timePattern.test(startTime)) {
    throw new CalendarEventServiceError(400, "invalid_event", "start_time must use HH:mm format.");
  }
  if (endTime !== undefined && !timePattern.test(endTime)) {
    throw new CalendarEventServiceError(400, "invalid_event", "end_time must use HH:mm format.");
  }
  if (startTime && endTime && endTime <= startTime) {
    throw new CalendarEventServiceError(
      400,
      "invalid_event",
      "end_time must be later than start_time.",
    );
  }

  const className = parseOptionalString(value, "class_name", 120);
  const section = parseOptionalString(value, "section", 64);
  if (className === "") {
    throw new CalendarEventServiceError(400, "invalid_event", "class_name cannot be empty.");
  }
  if (section === "") {
    throw new CalendarEventServiceError(400, "invalid_event", "section cannot be empty.");
  }
  if (section && !className) {
    throw new CalendarEventServiceError(
      400,
      "invalid_event",
      "section can only be supplied with class_name.",
    );
  }

  const description = parseOptionalString(value, "description", 2000);
  const eventType = value["event_type"];
  if (eventType !== undefined && !isEventType(eventType)) {
    throw new CalendarEventServiceError(400, "invalid_event", "event_type is not supported.");
  }

  return {
    title,
    event_date: eventDate,
    ...(startTime !== undefined ? { start_time: startTime } : {}),
    ...(endTime !== undefined ? { end_time: endTime } : {}),
    ...(className ? { class_name: className } : {}),
    ...(section ? { section } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(eventType !== undefined ? { event_type: eventType } : {}),
  };
}

export async function createCalendarEvent(
  input: unknown,
  repository: CalendarEventRepository,
  idempotencyKey: string,
): Promise<unknown> {
  if (!/^[a-f0-9]{64}$/.test(idempotencyKey)) {
    throw new CalendarEventServiceError(
      400,
      "invalid_event",
      "A valid idempotency key is required.",
    );
  }

  const event = parseCalendarEventInput(input);
  let classId: string | null = null;
  let subjectId: string | null = null;

  if (event.class_name) {
    const classes = await repository.listAccessibleActiveClasses();
    const normalizedName = event.class_name.toLocaleLowerCase();
    const normalizedSection = event.section?.toLocaleLowerCase();
    const matches = classes.filter(
      (candidate) =>
        candidate.name.trim().toLocaleLowerCase() === normalizedName &&
        (normalizedSection === undefined ||
          candidate.section?.trim().toLocaleLowerCase() === normalizedSection),
    );

    if (matches.length === 0) {
      throw new CalendarEventServiceError(
        404,
        "class_not_found",
        "No accessible active class matches the supplied name and section.",
      );
    }
    if (matches.length > 1) {
      throw new CalendarEventServiceError(
        409,
        "class_ambiguous",
        "More than one accessible active class matches; specify the section.",
      );
    }

    const match = matches[0];
    if (!match) {
      throw new CalendarEventServiceError(
        404,
        "class_not_found",
        "The accessible class was not found.",
      );
    }
    classId = match.id;
    subjectId = match.subject_id;
  }

  return repository.insertCalendarEvent({
    ai_tool_call_id: idempotencyKey,
    title: event.title,
    description: event.description || null,
    event_date: event.event_date,
    start_time: event.start_time ?? null,
    end_time: event.end_time ?? null,
    class_id: classId,
    subject_id: subjectId,
    event_type: event.event_type ?? "class",
  });
}
