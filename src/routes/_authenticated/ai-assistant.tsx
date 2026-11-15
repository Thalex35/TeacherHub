import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bot, CalendarDays, LoaderCircle, Plus, Send, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { sendTeacherAssistantTurn } from "@/lib/ai/assistant-server-function";
import type { AssistantActionResult, AssistantTurnResponse } from "@/lib/ai/assistant-contracts";

export const Route = createFileRoute("/_authenticated/ai-assistant")({
  component: TeacherAssistantPage,
});

type ChatMessage = NonNullable<AssistantTurnResponse["messages"]>[number];
type PendingConfirmation = NonNullable<AssistantTurnResponse["pendingConfirmations"]>[number];

const examplePrompts = [
  "Create an event for November 20 at 9:00 AM called Evaluation Informatique for Grade 7 A.",
  "Help me plan a short lesson about fractions.",
  "Suggest a classroom activity for tomorrow.",
];

function TeacherAssistantPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const endOfMessages = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessages.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pendingConfirmations, busy]);

  const applyResponse = (response: AssistantTurnResponse) => {
    if (response.sessionId) setSessionId(response.sessionId);
    setMessages(response.messages ?? []);
    setPendingConfirmations(response.pendingConfirmations ?? []);
    if ((response.createdEvents?.length ?? 0) > 0) {
      void queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
      setStatus("The event was created and saved to your TeacherHub calendar.");
    }
    if (response.warning) setError(response.warning);
  };

  const handleResult = (result: AssistantActionResult) => {
    if (result.response) applyResponse(result.response);
    if (!result.ok) setError(result.error.message);
    else setError("");
  };

  const sendMessage = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || busy || pendingConfirmations.length > 0) return;

    setDraft("");
    setError("");
    setStatus("");
    setBusy(true);
    try {
      handleResult(
        await sendTeacherAssistantTurn({
          data: { message, ...(sessionId ? { sessionId } : {}) },
        }),
      );
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "The assistant could not be reached. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const answerConfirmation = async (confirmation: PendingConfirmation, confirmed: boolean) => {
    if (busy || !sessionId) return;
    setError("");
    setStatus("");
    setBusy(true);
    try {
      const result = await sendTeacherAssistantTurn({
        data: {
          sessionId,
          confirmation: { interruptId: confirmation.interruptId, confirmed },
        },
      });
      handleResult(result);
      if (result.ok && !confirmed) {
        setStatus("The event was canceled. No calendar event was created.");
      }
    } catch (confirmationError) {
      setError(
        confirmationError instanceof Error
          ? confirmationError.message
          : "The confirmation could not be processed. Check your calendar before retrying.",
      );
    } finally {
      setBusy(false);
    }
  };

  const startNewConversation = () => {
    setSessionId(undefined);
    setMessages([]);
    setPendingConfirmations([]);
    setDraft("");
    setError("");
    setStatus("");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h1 className="font-display text-2xl font-semibold">Teacher Desk AI</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask for teaching help or prepare an event for your TeacherHub calendar.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={startNewConversation} disabled={busy}>
          <Plus className="size-4" />
          New conversation
        </Button>
      </header>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="text-base">Conversation</CardTitle>
          <CardDescription>
            Calendar changes are only made after you review and approve the event.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          <div
            className="max-h-[55vh] min-h-72 space-y-4 overflow-y-auto"
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
            aria-label="Assistant conversation"
          >
            {messages.length === 0 ? (
              <div className="mx-auto flex min-h-64 max-w-xl flex-col justify-center py-8">
                <div className="mb-4 flex items-center justify-center">
                  <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-6" aria-hidden="true" />
                  </span>
                </div>
                <h2 className="text-center font-semibold">How can I help today?</h2>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  Try one of these prompts:
                </p>
                <div className="mt-4 grid gap-2">
                  {examplePrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                      onClick={() => setDraft(prompt)}
                      disabled={busy}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <article
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" ? (
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="mb-1 flex items-center gap-1.5 text-xs font-medium opacity-75">
                      {message.role === "user" ? (
                        <>
                          <UserRound className="size-3" aria-hidden="true" />
                          You
                        </>
                      ) : (
                        <>
                          <Bot className="size-3" aria-hidden="true" />
                          Teacher Desk AI
                        </>
                      )}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  {message.role === "user" ? (
                    <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground">
                      <UserRound className="size-4" aria-hidden="true" />
                    </span>
                  ) : null}
                </article>
              ))
            )}

            {pendingConfirmations.map((confirmation) => (
              <ConfirmationCard
                key={confirmation.interruptId}
                confirmation={confirmation}
                busy={busy}
                onApprove={() => void answerConfirmation(confirmation, true)}
                onCancel={() => void answerConfirmation(confirmation, false)}
              />
            ))}

            {busy ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                {pendingConfirmations.length > 0 ? "Processing your decision…" : "Thinking…"}
              </div>
            ) : null}
            <div ref={endOfMessages} />
          </div>

          {status ? (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary" role="status">
              {status}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <form onSubmit={(event) => void sendMessage(event)} className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={
                pendingConfirmations.length > 0
                  ? "Approve or cancel the pending event above to continue."
                  : "Message Teacher Desk AI…"
              }
              aria-label="Message Teacher Desk AI"
              rows={2}
              maxLength={4_000}
              disabled={busy || pendingConfirmations.length > 0}
              className="min-h-12 resize-y"
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={busy || !draft.trim() || pendingConfirmations.length > 0}
            >
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmationCard({
  confirmation,
  busy,
  onApprove,
  onCancel,
}: {
  confirmation: PendingConfirmation;
  busy: boolean;
  onApprove: () => void;
  onCancel: () => void;
}) {
  const event = confirmation.event;

  return (
    <Card className="border-primary/40 bg-primary/[0.03]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-base">Review calendar event</CardTitle>
        </div>
        <CardDescription>
          Creating this event will save it to your TeacherHub calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {event ? (
          <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
            <dt className="font-medium text-muted-foreground">Title</dt>
            <dd className="break-words font-semibold">{event.title}</dd>
            <dt className="font-medium text-muted-foreground">Date</dt>
            <dd>{formatEventDate(event.event_date)}</dd>
            <dt className="font-medium text-muted-foreground">Start time</dt>
            <dd>{event.start_time ? formatEventTime(event.start_time) : "Not specified"}</dd>
            <dt className="font-medium text-muted-foreground">End time</dt>
            <dd>{event.end_time ? formatEventTime(event.end_time) : "Not specified"}</dd>
            <dt className="font-medium text-muted-foreground">Class</dt>
            <dd>
              {event.class_name
                ? `${event.class_name}${event.section ? ` ${event.section}` : ""}`
                : "All classes"}
            </dd>
            <dt className="font-medium text-muted-foreground">Event type</dt>
            <dd className="capitalize">{event.event_type}</dd>
            {event.description ? (
              <>
                <dt className="font-medium text-muted-foreground">Description</dt>
                <dd className="whitespace-pre-wrap break-words">{event.description}</dd>
              </>
            ) : null}
          </dl>
        ) : (
          <p className="whitespace-pre-wrap text-sm">{confirmation.message}</p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={onApprove} disabled={busy}>
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Create Event
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatEventDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function formatEventTime(value: string): string {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  if (hours === undefined || minutes === undefined) return value;
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  const hour12 = ((hours + 11) % 12) + 1;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
}
