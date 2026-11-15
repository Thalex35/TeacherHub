import { z } from "zod";

const sessionIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._:-]+$/);

export const assistantTurnInputSchema = z.union([
  z
    .object({
      message: z.string().trim().min(1).max(4_000),
      sessionId: sessionIdSchema.optional(),
    })
    .strict(),
  z
    .object({
      sessionId: sessionIdSchema,
      confirmation: z
        .object({
          interruptId: z.string().min(1).max(256),
          confirmed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);

export const assistantTurnResponseSchema = z
  .object({
    sessionId: sessionIdSchema.optional(),
    messages: z
      .array(
        z.object({
          id: z.string(),
          role: z.enum(["user", "assistant"]),
          text: z.string(),
        }),
      )
      .optional(),
    pendingConfirmations: z
      .array(
        z.object({
          interruptId: z.string(),
          toolName: z.string(),
          message: z.string(),
          event: z
            .object({
              title: z.string(),
              event_date: z.string(),
              start_time: z.string().optional(),
              end_time: z.string().optional(),
              class_name: z.string().optional(),
              section: z.string().optional(),
              description: z.string().optional(),
              event_type: z.string(),
            })
            .optional(),
        }),
      )
      .optional(),
    createdEvents: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          event_date: z.string(),
          start_time: z.string().nullable(),
          end_time: z.string().nullable(),
          description: z.string().nullable(),
          event_type: z.string(),
        }),
      )
      .optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
    code: z.string().optional(),
  })
  .strict();

export type AssistantTurnInput = z.infer<typeof assistantTurnInputSchema>;
export type AssistantTurnResponse = z.infer<typeof assistantTurnResponseSchema>;
export type AssistantActionResult =
  | { ok: true; response: AssistantTurnResponse }
  | {
      ok: false;
      error: { code: string; message: string };
      response?: AssistantTurnResponse;
    };
