import { createFileRoute } from "@tanstack/react-router";
import { Activity, CalendarDays, LogIn, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

import { getActivitySummary, listRecentActivity, type ActivitySummary, type RecentActivity } from "@/lib/account";
import { formatRelative, Metric, PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [events, setEvents] = useState<RecentActivity[]>([]);

  useEffect(() => {
    void Promise.all([getActivitySummary(), listRecentActivity()]).then(([activity, recent]) => {
      setSummary(activity);
      setEvents(recent);
    });
  }, []);

  return (
    <div>
      <PageIntro title="Analytics" description="Understand usage, engagement, and growth across the platform." />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Activity} label="Active today" value={summary?.active_today ?? 0} />
        <Metric icon={CalendarDays} label="Active this week" value={summary?.active_week ?? 0} />
        <Metric icon={LogIn} label="Logins today" value={summary?.logins_today ?? 0} />
        <Metric icon={UserPlus} label="New this week" value={summary?.registrations_week ?? 0} tone="success" />
      </div>
      <section className="admin-card admin-card--lilac mt-8 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Recent activity</h2>
          <p className="mt-1 text-xs text-muted-foreground">The latest 20 recorded sign-ins and app visits</p>
        </div>
        {events.length === 0 ? <p className="p-6 text-sm text-muted-foreground">No activity recorded yet.</p> : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div key={event.event_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div><p className="font-medium">{event.full_name || event.email}</p><p className="text-sm text-muted-foreground">{event.email} · {event.event_type === "login" ? "Sign in" : "App access"}</p></div>
                <time className="text-sm text-muted-foreground" dateTime={event.created_at}>{formatRelative(event.created_at)}</time>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
