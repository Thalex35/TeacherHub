import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Mail, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { listAccountProfiles, listAccountUsage, type AccountProfile, type AccountUsage } from "@/lib/account";
import { formatRelative, isOnline, PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/users/$userId")({
  ssr: false,
  component: AdminUserDetailPage,
});

function AdminUserDetailPage() {
  const { userId } = Route.useParams();
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [usage, setUsage] = useState<AccountUsage | null>(null);

  useEffect(() => {
    void Promise.all([listAccountProfiles(), listAccountUsage()]).then(([profiles, usages]) => {
      setProfile(profiles.find((item) => item.id === userId) ?? null);
      setUsage(usages.find((item) => item.user_id === userId) ?? null);
    });
  }, [userId]);

  if (!profile) return <p className="text-sm text-muted-foreground">Loading user...</p>;

  const online = isOnline(profile.last_seen_at);
  return (
    <div>
      <Link to="/admin/users" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Back to users</Link>
      <PageIntro title={profile.full_name || "User details"} description={profile.email} />
      <div className="mt-6 flex flex-wrap items-center gap-3"><Badge variant="outline">{profile.account_status}</Badge>{profile.role === "admin" ? <Badge>Admin</Badge> : null}<span className="flex items-center gap-2 text-sm text-muted-foreground"><span className={`size-2 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />{online ? "Online now" : `Last connection ${formatRelative(profile.last_seen_at)}`}</span></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="admin-card admin-card--lilac overflow-hidden"><div className="border-b border-border/70 px-5 py-4"><h2 className="font-semibold">Account information</h2></div><div className="grid gap-5 p-5 sm:grid-cols-2"><Info icon={Mail} label="Email" value={profile.email} /><Info icon={CalendarDays} label="Registered" value={new Date(profile.created_at).toLocaleDateString()} /><Info icon={Clock3} label="Last connection" value={profile.last_seen_at ? new Date(profile.last_seen_at).toLocaleString() : "Never"} /><Info icon={ShieldCheck} label="Approved" value={profile.approved_at ? new Date(profile.approved_at).toLocaleDateString() : "Not approved"} /><Info icon={CheckCircle2} label="Onboarding" value={profile.onboarding_completed_at ? "Completed" : "Not completed"} /></div></section>
        <section className="admin-card admin-card--mint overflow-hidden"><div className="border-b border-border/70 px-5 py-4"><h2 className="font-semibold">Workspace usage</h2></div><div className="space-y-5 p-5"><Usage icon={Users} label="Students" current={usage?.students_count ?? 0} max={profile.max_students} /><Usage icon={CalendarDays} label="Classes" current={usage?.classes_count ?? 0} max={profile.max_classes} /><Info icon={ShieldCheck} label="Storage used" value={`${((usage?.storage_bytes ?? 0) / 1073741824).toFixed(2)} GB of ${(profile.max_storage_bytes / 1073741824).toFixed(0)} GB`} /></div></section>
      </div>
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) { return <div className="flex gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div></div>; }
function Usage({ icon: Icon, label, current, max }: { icon: typeof Users; label: string; current: number; max: number }) { const percentage = max ? Math.min(100, Math.round((current / max) * 100)) : 0; return <div><div className="flex justify-between text-sm"><span className="flex items-center gap-2"><Icon className="size-4 text-muted-foreground" />{label}</span><span className="text-muted-foreground">{current}/{max}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} /></div></div>; }
