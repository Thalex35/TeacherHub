import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock3, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { listAccountProfiles, updateAccountStatus, type AccountProfile } from "@/lib/account";
import { PageIntro } from "./admin.index";

export const Route = createFileRoute("/admin/access-requests")({
  ssr: false,
  component: AccessRequestsPage,
});

function AccessRequestsPage() {
  const [profiles, setProfiles] = useState<AccountProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setProfiles((await listAccountProfiles()).filter((profile) => profile.account_status === "pending"));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const setStatus = async (profile: AccountProfile, status: AccountProfile["account_status"]) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await updateAccountStatus(profile.id, status, data.user.id);
    await load();
  };

  return (
    <div>
      <PageIntro title="Access requests" description="Review and approve teachers waiting to join TeacherHub." />
      <div className="admin-card admin-card--peach mt-8 flex items-center gap-3 p-4 text-amber-950">
        <Clock3 className="size-5 shrink-0" />
        <p className="text-sm"><strong>{profiles.length}</strong> request{profiles.length === 1 ? "" : "s"} waiting for review.</p>
      </div>
      <section className="admin-card admin-card--plain mt-6 overflow-hidden">
        {loading ? <p className="p-6 text-sm text-muted-foreground">Loading requests...</p> : profiles.length === 0 ? (
          <div className="p-10 text-center"><Check className="mx-auto size-8 text-emerald-600" /><p className="mt-3 font-medium">All caught up</p><p className="mt-1 text-sm text-muted-foreground">There are no pending access requests.</p></div>
        ) : (
          <div className="divide-y divide-border">{profiles.map((profile) => (
            <div key={profile.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div><p className="font-medium">{profile.full_name || profile.email}</p><p className="text-sm text-muted-foreground">{profile.email}</p><p className="mt-1 text-xs text-muted-foreground">Requested {new Date(profile.created_at).toLocaleDateString()}</p></div>
              <div className="flex gap-2"><Button size="sm" onClick={() => void setStatus(profile, "approved")}><Check className="mr-1 size-4" />Approve</Button><Button size="sm" variant="outline" onClick={() => void setStatus(profile, "rejected")}><X className="mr-1 size-4" />Reject</Button></div>
            </div>
          ))}</div>
        )}
      </section>
    </div>
  );
}
