import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile } from "@/lib/account";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const profile = await getAccountProfile(data.user.id);
    if (!profile || profile.account_status !== "approved") throw redirect({ to: "/pending" });
    return { user: data.user, profile };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
