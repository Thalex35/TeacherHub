import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Activity, Check, Clock3, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  getAccountProfile,
  listAccountProfiles,
  updateAccountStatus,
  type AccountProfile,
} from "@/lib/account";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const profile = await getAccountProfile(data.user.id);
    if (!profile || profile.role !== "admin" || profile.account_status !== "approved") {
      throw redirect({ to: "/dashboard" });
    }
    return { user: data.user };
  },
  component: AdminPage,
});

function AdminPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      setProfiles(await listAccountProfiles());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const setStatus = async (profile: AccountProfile, status: AccountProfile["account_status"]) => {
    await updateAccountStatus(profile.id, status, user.id);
    await loadProfiles();
  };

  const pending = profiles.filter((profile) => profile.account_status === "pending").length;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Admin dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Monitor account access and keep your TeacherHub workspace healthy.
            </p>
          </div>
          <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
            Back to app
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={Users} label="Total accounts" value={profiles.length} tone="default" />
          <Metric icon={Clock3} label="Waiting approval" value={pending} tone="warning" />
          <Metric
            icon={Activity}
            label="Approved"
            value={profiles.filter((profile) => profile.account_status === "approved").length}
            tone="success"
          />
          <Metric
            icon={UserRound}
            label="Restricted"
            value={
              profiles.filter((profile) =>
                ["rejected", "suspended"].includes(profile.account_status),
              ).length
            }
            tone="muted"
          />
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Approval queue</h2>
                  <p className="text-xs text-muted-foreground">Requests requiring your review</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                {pending} pending
              </span>
            </div>
            {loading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading accounts...</p>
            ) : profiles.filter((profile) => profile.account_status === "pending").length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Check className="mx-auto size-8 text-emerald-600" />
                <p className="mt-3 font-medium">All caught up</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  There are no pending access requests.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {profiles
                  .filter((profile) => profile.account_status === "pending")
                  .map((profile) => (
                    <AccountRow key={profile.id} profile={profile} onStatusChange={setStatus} />
                  ))}
              </div>
            )}
          </div>

          <div className="surface overflow-hidden">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-semibold">Recent registrations</h2>
              <p className="mt-1 text-xs text-muted-foreground">Newest accounts across your app</p>
            </div>
            <div className="divide-y divide-border">
              {profiles.slice(0, 5).map((profile) => (
                <div key={profile.id} className="flex items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {profile.full_name || profile.email}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
                  </div>
                  <StatusPill status={profile.account_status} />
                </div>
              ))}
              {profiles.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">No accounts yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function AccountRow({
  profile,
  onStatusChange,
}: {
  profile: AccountProfile;
  onStatusChange: (profile: AccountProfile, status: AccountProfile["account_status"]) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="truncate font-medium">{profile.full_name || profile.email}</p>
        <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Registered {new Date(profile.created_at).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => onStatusChange(profile, "approved")}>
          <Check className="mr-1 size-4" /> Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onStatusChange(profile, "rejected")}>
          <X className="mr-1 size-4" /> Reject
        </Button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: AccountProfile["account_status"] }) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    suspended: "bg-slate-100 text-slate-700",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  tone: "default" | "warning" | "success" | "muted";
}) {
  const iconStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-100 text-amber-700",
    success: "bg-emerald-100 text-emerald-700",
    muted: "bg-muted text-muted-foreground",
  } as const;
  return (
    <div className="surface flex items-center gap-4 p-5">
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${iconStyles[tone]}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </div>
    </div>
  );
}
