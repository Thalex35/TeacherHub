import { LlmAgent } from "@google/adk";
import type { BaseLlm } from "@google/adk";
import {
  createCalendarEventTool,
  type CalendarEventToolOptions,
} from "./tools/create-calendar-event.ts";

export type AuthenticatedAgentOptions = Required<
  Pick<CalendarEventToolOptions, "accessToken" | "teacherHubBaseUrl">
> &
  Pick<CalendarEventToolOptions, "fetchImplementation"> & {
    model?: string | BaseLlm;
  };

function makeAgent(
  options: CalendarEventToolOptions = {},
  model: string | BaseLlm = "gemini-3.5-flash-lite",
) {
  return new LlmAgent({
    name: "teacherhub_assistant",
    model,
    description: "TeacherHub AI Assistant",
    instruction: `
    You are TeacherHub Assistant.

    You help teachers with:
    - Lesson preparation
    - Student evaluations
    - Classroom management
    - Teaching administration

    Communicate in the language requested
    by the teacher.

    For calendar event creation, collect any missing details and do not guess.
    The create_calendar_event tool will display a concise event summary and pause
    for explicit teacher confirmation before sending a create request. Never claim
    that an event was created unless the tool succeeds.
  `,
    tools: [createCalendarEventTool(options)],
  });
}

export function createAuthenticatedRootAgent(options: AuthenticatedAgentOptions) {
  return makeAgent(options, options.model);
}

export const rootAgent = makeAgent();
