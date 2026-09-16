import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { listAccountProfiles, listAccountUsage, type AccountProfile, type AccountUsage } from "@/lib/account";
import { formatRelative, isOnline, PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/users/")({
  ssr: false,
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [usage, setUsage] = useState<AccountUsage[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadProfiles = () => listAccountProfiles().then(setProfiles);
    const loadUsage = () => listAccountUsage().then(setUsage);

    void loadProfiles();
    void loadUsage();
    const refresh = window.setInterval(() => {
      void loadProfiles();
      void loadUsage();
    }, 15_000);
    const channel = supabase
      .channel("admin-users-presence")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new as AccountProfile;
          setProfiles((current) =>
            current.map((profile) => (profile.id === updated.id ? { ...profile, ...updated } : profile)),
          );
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(refresh);
      void supabase.removeChannel(channel);
    };
  }, []);

  const usageByUser = new Map(usage.map((item) => [item.user_id, item]));
  const query = search.trim().toLowerCase();
  const filtered = profiles.filter((profile) => !query || profile.email.toLowerCase().includes(query) || (profile.full_name ?? "").toLowerCase().includes(query));

  return (
    <div>
      <PageIntro title="Users" description="See who uses TeacherHub, their account state, and their latest connection." />
      <div className="relative mt-8 max-w-xl"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="pl-9" aria-label="Search users" /></div>
      <section className="admin-card admin-card--sky mt-6 overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.5fr)_150px_180px_110px] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid"><span>User</span><span>Last connection</span><span>Usage</span><span>Status</span></div>
        {filtered.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No users match your search.</p> : <div className="divide-y divide-border">{filtered.map((profile) => {
          const accountUsage = usageByUser.get(profile.id);
          const online = isOnline(profile.last_seen_at);
          return <Link key={profile.id} to="/admin/users/$userId" params={{ userId: profile.id }} className="grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1.5fr)_150px_180px_110px] md:items-center md:gap-4">
            <div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" /></div><div className="min-w-0"><p className="truncate font-medium">{profile.full_name || "Unnamed user"}</p><p className="truncate text-sm text-muted-foreground">{profile.email}</p></div></div>
            <div className="text-sm"><span className={`mr-2 inline-block size-2 rounded-full ${online ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />{online ? "Online" : formatRelative(profile.last_seen_at)}</div>
            <div className="text-sm text-muted-foreground">{accountUsage?.students_count ?? 0}/{profile.max_students} students · {accountUsage?.classes_count ?? 0}/{profile.max_classes} classes</div>
            <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${profile.account_status === "approved" ? "bg-emerald-100 text-emerald-800" : profile.account_status === "pending" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{profile.account_status}</span>
          </Link>;
        })}</div>}
      </section>
    </div>
  );
}
