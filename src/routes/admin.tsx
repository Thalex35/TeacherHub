import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile } from "@/lib/account";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const profile = await getAccountProfile(data.user.id);
    if (!profile || profile.role !== "admin" || profile.account_status !== "approved") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
