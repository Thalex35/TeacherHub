import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock3, LogOut } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile } from "@/lib/account";

export const Route = createFileRoute("/pending")({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) throw redirect({ to: "/auth" });
    const profile = await getAccountProfile(session.session.user.id);
    if (profile?.account_status === "approved") throw redirect({ to: "/dashboard" });
    return { profile };
  },
  component: PendingPage,
});

function PendingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="surface w-full max-w-md p-8 text-center">
        <Clock3 className="mx-auto size-10 text-primary" />
        <h1 className="mt-5 text-2xl font-semibold">Request received</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is waiting for approval. You will be able to enter TeacherHub once an
          administrator approves it.
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut} disabled={loading}>
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </div>
    </main>
  );
}
