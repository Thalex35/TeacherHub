import { FunctionTool } from "@google/adk";
import { createHash } from "node:crypto";
import { z } from "zod";

const eventParameters = z
  .object({
    title: z.string().trim().min(1).max(200).describe("Event title."),
    event_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe("Event date normalized as YYYY-MM-DD."),
    start_time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional()
      .describe("Optional start time in 24-hour HH:mm format."),
    end_time: z
      .string()
      .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
      .optional()
      .describe("Optional end time in 24-hour HH:mm format."),
    class_name: z.string().trim().min(1).max(120).optional().describe("Optional class name."),
    section: z.string().trim().min(1).max(64).optional().describe("Optional class section."),
    description: z.string().max(2000).optional().describe("Optional event description."),
    event_type: z
      .string()
      .optional()
      .describe("Optional TeacherHub event type; the backend validates supported values."),
  })
  .strict();

export type CreateCalendarEventInput = z.infer<typeof eventParameters>;

export type CalendarEventToolOptions = {
  accessToken?: string;
  teacherHubBaseUrl?: string;
  fetchImplementation?: typeof fetch;
};

function safeConfirmationText(value: string): string {
  return value
    .replace(/[\r\n\t]/g, " ")
    .replace(/[\\`*_{}()#+.!|><~-]/g, "\\$&")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]");
}

function displayDate(value: string): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return safeConfirmationText(value);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function displayTime(value?: string): string {
  if (!value) return "Time not specified";
  const [hour, minute] = value.split(":").map(Number);
  if (hour === undefined || minute === undefined) return "Time not specified";
  const hour12 = ((hour + 11) % 12) + 1;
  return `${hour12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

function displayEventType(value?: string): string {
  const eventType = value ?? "class";
  return eventType.charAt(0).toUpperCase() + eventType.slice(1);
}

function confirmationHint(input: CreateCalendarEventInput): string {
  const classLabel = input.class_name
    ? `Class: ${safeConfirmationText(input.class_name)}${input.section ? ` ${safeConfirmationText(input.section)}` : ""}`
    : "General calendar event";
  const timeLines = [
    input.start_time ? `Starts: ${displayTime(input.start_time)}` : undefined,
    input.end_time ? `Ends: ${displayTime(input.end_time)}` : undefined,
  ].filter((line): line is string => line !== undefined);

  return [
    "I'm ready to create:",
    `**${safeConfirmationText(input.title)}**`,
    classLabel,
    displayDate(input.event_date),
    ...timeLines,
    `Event type: ${displayEventType(input.event_type)}`,
    ...(input.description ? [`Description: ${safeConfirmationText(input.description)}`] : []),
    "",
    "Create this event? This will add it to your TeacherHub calendar.",
  ].join("\n");
}

type ToolRunRequest = Parameters<FunctionTool<typeof eventParameters>["runAsync"]>[0];

class ConfirmationGatedCalendarEventTool extends FunctionTool<typeof eventParameters> {
  private readonly accessToken: string | undefined;
  private readonly teacherHubBaseUrl: string | undefined;

  constructor(options: CalendarEventToolOptions) {
    const fetchImplementation = options.fetchImplementation ?? fetch;
    super({
      name: "create_calendar_event",
      description:
        "Create an event in the authenticated teacher's existing TeacherHub calendar. " +
        "Use only the supplied event fields. The tool presents the exact event details and " +
        "requires explicit teacher confirmation before it sends the create request. " +
        "Never invent a class, section, date, time, or event type.",
      parameters: eventParameters,
      execute: async (input, toolContext) => {
        if (!options.accessToken || !options.teacherHubBaseUrl) {
          throw new Error("An authenticated TeacherHub request context is required.");
        }
        if (!toolContext?.functionCallId) {
          throw new Error("The calendar event call has no idempotency context.");
        }

        const endpoint = new URL("/api/ai/calendar-events", options.teacherHubBaseUrl);
        const isLocalHttp =
          endpoint.protocol === "http:" &&
          (endpoint.hostname === "localhost" || endpoint.hostname === "127.0.0.1");
        if (endpoint.protocol !== "https:" && !isLocalHttp) {
          throw new Error("The TeacherHub calendar endpoint must use HTTPS.");
        }

        const response = await fetchImplementation(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${options.accessToken}`,
            "content-type": "application/json",
            "idempotency-key": createHash("sha256")
              .update(toolContext.functionCallId)
              .digest("hex"),
          },
          body: JSON.stringify(input),
        });
        const result: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof result === "object" &&
            result !== null &&
            "error" in result &&
            typeof result.error === "string"
              ? result.error
              : "TeacherHub could not create the calendar event.";
          throw new Error(message);
        }
        return result;
      },
    });

    this.accessToken = options.accessToken;
    this.teacherHubBaseUrl = options.teacherHubBaseUrl;
  }

  override async checkRequireConfirmation(): Promise<boolean> {
    return Boolean(this.accessToken && this.teacherHubBaseUrl);
  }

  override async runAsync(request: ToolRunRequest): Promise<unknown> {
    const input = eventParameters.parse(request.args);
    if (!this.accessToken || !this.teacherHubBaseUrl) {
      return super.runAsync(request);
    }

    const confirmation = request.toolContext.toolConfirmation;
    if (!confirmation) {
      request.toolContext.requestConfirmation({
        hint: confirmationHint(input),
        payload: { event: { ...input, event_type: input.event_type ?? "class" } },
      });
      request.toolContext.actions.skipSummarization = true;
      return { confirmation_required: true };
    }
    if (!confirmation.confirmed) {
      return { error: "The teacher declined to create this event." };
    }

    return super.runAsync(request);
  }
}

export function createCalendarEventTool(
  options: CalendarEventToolOptions = {},
): FunctionTool<typeof eventParameters> {
  return new ConfirmationGatedCalendarEventTool(options);
}
