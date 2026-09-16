import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { OnboardingGuide } from "@/components/onboarding-guide";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile, recordActivity } from "@/lib/account";
import { useState } from "react";

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
  const { profile } = Route.useRouteContext();
  const [showGuide, setShowGuide] = useState(profile.onboarding_completed_at === null);

  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      {showGuide ? <OnboardingGuide onComplete={() => setShowGuide(false)} /> : null}
    </>
  );
}
