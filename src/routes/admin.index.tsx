import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock3, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getActivitySummary,
  listAccountProfiles,
  listRecentActivity,
  type AccountProfile,
  type ActivitySummary,
  type RecentActivity,
} from "@/lib/account";

export const Route = createFileRoute("/admin/")({
  ssr: false,
  component: AdminOverviewPage,
});

function AdminOverviewPage() {
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([listAccountProfiles(), getActivitySummary(), listRecentActivity()]).then(
      ([accounts, activity, events]) => {
        setProfiles(accounts);
        setSummary(activity);
        setRecentActivity(events);
        setLoading(false);
      },
    );
  }, []);

  const pending = profiles.filter((profile) => profile.account_status === "pending").length;
  const approved = profiles.filter((profile) => profile.account_status === "approved").length;

  return (
    <div>
      <PageIntro title="Dashboard" description="A quick overview of your TeacherHub platform." />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Total users" value={profiles.length} />
        <Metric icon={ShieldCheck} label="Approved users" value={approved} tone="success" />
        <Metric icon={Clock3} label="Access requests" value={pending} tone="warning" />
        <Metric icon={Activity} label="Active today" value={summary?.active_today ?? 0} />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="admin-card admin-card--lilac p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Platform state
          </p>
          <h2 className="mt-2 text-xl font-semibold">Everything at a glance</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Stat label="Active this week" value={summary?.active_week ?? 0} />
            <Stat label="Logins today" value={summary?.logins_today ?? 0} />
            <Stat label="New today" value={summary?.registrations_today ?? 0} />
            <Stat label="New this week" value={summary?.registrations_week ?? 0} />
          </div>
        </div>
        <div className="admin-card admin-card--sky overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Latest activity</h2>
            <p className="mt-1 text-xs text-muted-foreground">The most recent platform events</p>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading activity...</p>
          ) : recentActivity.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.slice(0, 5).map((event) => (
                <div key={event.event_id} className="flex justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{event.full_name || event.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.event_type === "login" ? "Signed in" : "Used the app"}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={event.created_at}>
                    {formatRelative(event.created_at)}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function PageIntro({ title, description }: { title: string; description: string }) {
  return (
    <header>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Administration</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

export function Metric({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone?: "default" | "success" | "warning";
}) {
  const iconTone = {
    default: "bg-primary/10 text-primary",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
  }[tone];
  return (
    <div className={`admin-card flex items-center gap-4 p-5 ${
      tone === "success"
        ? "admin-card--mint"
        : tone === "warning"
          ? "admin-card--peach"
          : "admin-card--sky"
    }`}>
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconTone}`}><Icon className="size-5" /></div>
      <div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p></div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="admin-card admin-card--plain p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

export function formatRelative(value: string | null) {
  if (!value) return "Never";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return new Date(value).toLocaleDateString();
}

export function isOnline(value: string | null) {
  return Boolean(value && Date.now() - new Date(value).getTime() <= 90_000);
}

