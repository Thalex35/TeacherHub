import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Check, ShieldCheck, X } from "lucide-react";
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
            <h1 className="mt-2 text-3xl font-semibold">Account requests</h1>
          </div>
          <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
            Back to app
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Total accounts" value={profiles.length} />
          <Metric label="Waiting approval" value={pending} />
          <Metric
            label="Approved"
            value={profiles.filter((profile) => profile.account_status === "approved").length}
          />
        </div>

        <div className="surface mt-8 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <ShieldCheck className="size-5 text-primary" />
            <h2 className="font-semibold">Users</h2>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-muted-foreground">Loading accounts...</p>
          ) : (
            <div className="divide-y divide-border">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                >
                  <div>
                    <p className="font-medium">{profile.full_name || profile.email}</p>
                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm capitalize text-muted-foreground">
                      {profile.account_status}
                    </span>
                    {profile.account_status === "pending" ? (
                      <>
                        <Button size="sm" onClick={() => void setStatus(profile, "approved")}>
                          <Check className="mr-1 size-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void setStatus(profile, "rejected")}
                        >
                          <X className="mr-1 size-4" /> Reject
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
