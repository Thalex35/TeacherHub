import { Bell, CalendarDays } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEvents } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";

const dateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

function daysUntil(eventDate: string, today: Date) {
  const event = new Date(`${eventDate}T00:00:00`);
  return Math.round((event.getTime() - dateOnly(today).getTime()) / 86_400_000);
}

function reminderLabel(daysLeft: number) {
  if (daysLeft === 0) return "Today";
  return `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
}

function sortReminders(a: CalendarEvent, b: CalendarEvent) {
  return a.event_date.localeCompare(b.event_date) || a.title.localeCompare(b.title);
}

export function EventNotifications() {
  const navigate = useNavigate();
  const events = useEvents();
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const reminders = (events.data ?? [])
    .filter((event) => {
      const daysLeft = daysUntil(event.event_date, today);
      return daysLeft >= 0 && daysLeft <= 2;
    })
    .sort(sortReminders);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Event reminders">
          <Bell className="size-5" />
          {reminders.length > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 text-destructive-foreground">
              {reminders.length > 9 ? "9+" : reminders.length}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Event reminders</p>
            <p className="text-xs text-muted-foreground">The next two days and today</p>
          </div>
          <CalendarDays className="size-4 text-muted-foreground" />
        </div>

        {events.isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Loading reminders...</p>
        ) : reminders.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No events in the next two days.</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((event) => {
              const daysLeft = daysUntil(event.event_date, today);
              return (
                <button
                  key={event.id}
                  type="button"
                  className="block w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                  onClick={() =>
                    void navigate({ to: "/calendar", search: { date: event.event_date } })
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{event.title}</p>
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      {reminderLabel(daysLeft)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(event.event_date)}
                    {event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {titleCase(event.event_type)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
