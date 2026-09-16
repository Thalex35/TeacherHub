import { Bell, CalendarDays, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useEvents } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import type { CalendarEvent } from "@/lib/types";
import { getAccountProfile, listAccountProfiles, type AccountProfile } from "@/lib/account";
import { supabase } from "@/integrations/supabase/client";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingProfiles, setPendingProfiles] = useState<AccountProfile[]>([]);

  const loadPendingProfiles = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    const profile = await getAccountProfile(data.user.id);
    const admin = profile?.role === "admin" && profile.account_status === "approved";
    setIsAdmin(admin);
    if (!admin) return;
    const profiles = await listAccountProfiles();
    setPendingProfiles(profiles.filter((item) => item.account_status === "pending"));
  };

  useEffect(() => {
    void loadPendingProfiles();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("admin-access-request-notifications")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;
            if (deletedId) {
              setPendingProfiles((current) => current.filter((item) => item.id !== deletedId));
            }
            return;
          }
          const profile = payload.new as AccountProfile;
          if (profile.account_status !== "pending") {
            setPendingProfiles((current) => current.filter((item) => item.id !== profile.id));
            return;
          }
          setPendingProfiles((current) => {
            const existing = current.some((item) => item.id === profile.id);
            return existing
              ? current.map((item) => (item.id === profile.id ? profile : item))
              : [profile, ...current];
          });
          if (payload.eventType === "INSERT") {
            toast.info("New access request", {
              description: `${profile.full_name || profile.email} is waiting for approval.`,
              action: {
                label: "Review",
                onClick: () => void navigate({ to: "/admin/access-requests" }),
              },
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isAdmin, navigate]);

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
  const notificationCount = reminders.length + (isAdmin ? pendingProfiles.length : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {notificationCount > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 text-destructive-foreground">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Important updates for your workspace</p>
          </div>
          <CalendarDays className="size-4 text-muted-foreground" />
        </div>

        {events.isLoading ? (
          <p className="py-4 text-sm text-muted-foreground">Loading reminders...</p>
        ) : (
          <div className="space-y-4">
            {isAdmin ? (
              <section>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <ShieldCheck className="size-4 text-primary" /> Access requests
                </div>
                {pendingProfiles.length === 0 ? (
                  <p className="rounded-md bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                    No pending access requests.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingProfiles.slice(0, 5).map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        className="block w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                        onClick={() => void navigate({ to: "/admin/access-requests" })}
                      >
                        <p className="truncate text-sm font-medium">
                          {profile.full_name || profile.email}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Request received {formatDate(profile.created_at.slice(0, 10))}
                        </p>
                      </button>
                    ))}
                    {pendingProfiles.length > 5 ? (
                      <button
                        type="button"
                        className="w-full text-center text-xs font-medium text-primary hover:underline"
                        onClick={() => void navigate({ to: "/admin/access-requests" })}
                      >
                        View all {pendingProfiles.length} requests
                      </button>
                    ) : null}
                  </div>
                )}
              </section>
            ) : null}

            <section>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <CalendarDays className="size-4 text-primary" /> Event reminders
              </div>
              {reminders.length === 0 ? (
                <p className="rounded-md bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
                  No events in the next two days.
                </p>
              ) : (
                <div className="space-y-2">
                  {reminders.map((event) => {
                    const daysLeft = daysUntil(event.event_date, today);
                    return (
                      <button
                        key={event.id}
                        type="button"
                        className="block w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-accent"
                        onClick={() => void navigate({ to: "/calendar", search: { date: event.event_date } })}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 truncate text-sm font-medium">{event.title}</p>
                          <span className="shrink-0 text-xs font-semibold text-primary">{reminderLabel(daysLeft)}</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.event_date)}{event.start_time ? ` · ${event.start_time.slice(0, 5)}` : ""}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{titleCase(event.event_type)}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
