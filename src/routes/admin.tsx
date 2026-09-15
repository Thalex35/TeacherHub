import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Check,
  Clock3,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  getAccountProfile,
  listAccountProfiles,
  updateAccountStatus,
  type AccountProfile,
} from "@/lib/account";
import { listAccountUsage, updateAccountLimits, type AccountUsage } from "@/lib/account";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AccountProfile["account_status"]>("all");
  const [usage, setUsage] = useState<AccountUsage[]>([]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      setProfiles(await listAccountProfiles());
      setUsage(await listAccountUsage());
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
  const filteredProfiles = profiles.filter((profile) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      profile.email.toLowerCase().includes(query) ||
      (profile.full_name ?? "").toLowerCase().includes(query);
    return matchesSearch && (statusFilter === "all" || profile.account_status === statusFilter);
  });
  const usageByUser = new Map(usage.map((item) => [item.user_id, item]));

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

        <section className="surface mt-8 overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Users</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Search accounts and manage access status.
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredProfiles.length} of {profiles.length}
              </span>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="pl-9"
                  aria-label="Search users"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "all" | AccountProfile["account_status"])
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                aria-label="Filter users by status"
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading users...</p>
          ) : filteredProfiles.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No users match the current filters.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filteredProfiles.map((profile) => (
                <UserRow
                  key={profile.id}
                  profile={profile}
                  isCurrentUser={profile.id === user.id}
                  usage={usageByUser.get(profile.id)}
                  onStatusChange={setStatus}
                  onLimitsChange={async (limits) => {
                    await updateAccountLimits(profile.id, limits);
                    await loadProfiles();
                  }}
                />
              ))}
            </div>
          )}
        </section>
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

function UserRow({
  profile,
  isCurrentUser,
  usage,
  onStatusChange,
  onLimitsChange,
}: {
  profile: AccountProfile;
  isCurrentUser: boolean;
  usage?: AccountUsage;
  onStatusChange: (profile: AccountProfile, status: AccountProfile["account_status"]) => void;
  onLimitsChange: (
    limits: Pick<AccountProfile, "max_students" | "max_classes" | "max_storage_bytes">,
  ) => Promise<void>;
}) {
  const nextStatus = {
    pending: "approved",
    approved: "suspended",
    rejected: "approved",
    suspended: "approved",
  } as const;
  const actionLabel = {
    pending: "Approve",
    approved: "Suspend",
    rejected: "Approve",
    suspended: "Reactivate",
  } as const;
  const actionIcon = profile.account_status === "suspended" ? RotateCcw : Check;
  const ActionIcon = actionIcon;
  const [editingLimits, setEditingLimits] = useState(false);
  const [limits, setLimits] = useState({
    max_students: profile.max_students,
    max_classes: profile.max_classes,
    max_storage_bytes: Math.round(profile.max_storage_bytes / 1073741824),
  });
  const storageUsedGb = (usage?.storage_bytes ?? 0) / 1073741824;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{profile.full_name || profile.email}</p>
          {profile.role === "admin" ? <StatusPill status="approved" label="admin" /> : null}
          {isCurrentUser ? <span className="text-xs text-muted-foreground">You</span> : null}
        </div>
        <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {usage?.students_count ?? 0}/{profile.max_students} students · {usage?.classes_count ?? 0}
          /{profile.max_classes} classes · {storageUsedGb.toFixed(2)}/
          {Math.round(profile.max_storage_bytes / 1073741824)} GB
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusPill status={profile.account_status} />
        {!isCurrentUser ? (
          <>
            <Button
              size="sm"
              variant={profile.account_status === "approved" ? "outline" : "default"}
              onClick={() => onStatusChange(profile, nextStatus[profile.account_status])}
            >
              <ActionIcon className="mr-1 size-4" /> {actionLabel[profile.account_status]}
            </Button>
            {profile.account_status === "pending" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onStatusChange(profile, "rejected")}
              >
                <X className="mr-1 size-4" /> Reject
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
      {editingLimits ? (
        <div className="w-full rounded-md bg-muted/50 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {(["max_students", "max_classes", "max_storage_bytes"] as const).map((key) => (
              <label key={key} className="text-xs text-muted-foreground">
                {key === "max_storage_bytes"
                  ? "Storage (GB)"
                  : key === "max_students"
                    ? "Students"
                    : "Classes"}
                <Input
                  type="number"
                  min="1"
                  value={limits[key]}
                  onChange={(event) => setLimits({ ...limits, [key]: Number(event.target.value) })}
                  className="mt-1"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingLimits(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() =>
                void onLimitsChange({
                  ...limits,
                  max_storage_bytes: limits.max_storage_bytes * 1073741824,
                }).then(() => setEditingLimits(false))
              }
            >
              Save limits
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="ghost" onClick={() => setEditingLimits(true)}>
          Edit limits
        </Button>
      )}
    </div>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: AccountProfile["account_status"];
  label?: string;
}) {
  const styles = {
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-emerald-100 text-emerald-800",
    rejected: "bg-rose-100 text-rose-800",
    suspended: "bg-slate-100 text-slate-700",
  } as const;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>
      {label ?? status}
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
