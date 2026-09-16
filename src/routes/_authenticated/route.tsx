import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { OnboardingGuide } from "@/components/onboarding-guide";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile, recordActivity } from "@/lib/account";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const profile = await getAccountProfile(data.user.id);
    if (!profile || profile.account_status !== "approved") throw redirect({ to: "/pending" });
    void recordActivity("app_access");
    return { user: data.user, profile };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { profile, user } = Route.useRouteContext();
  const navigate = Route.useNavigate();
  const [showGuide, setShowGuide] = useState(profile.onboarding_completed_at === null);

  useEffect(() => {
    const channel = supabase
      .channel(`account-access-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if ((payload.new as { account_status?: string }).account_status === "suspended") {
            void navigate({ to: "/pending" });
          }
        },
      )
      .subscribe();

    const heartbeat = () => void recordActivity("app_access");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    const interval = window.setInterval(heartbeat, 60_000);
    window.addEventListener("focus", heartbeat);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      void supabase.removeChannel(channel);
      window.clearInterval(interval);
      window.removeEventListener("focus", heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [navigate, user.id]);

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {showGuide ? <OnboardingGuide onComplete={() => setShowGuide(false)} /> : null}
    </>
  );
}
