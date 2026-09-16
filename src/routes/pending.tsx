import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Clock3, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  const { profile } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isSuspended = profile?.account_status === "suspended";

  useEffect(() => {
    let userId: string | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    void supabase.auth.getUser().then(({ data }) => {
      userId = data.user?.id ?? null;
      if (!userId) return;

      channel = supabase
        .channel(`account-status-${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
          (payload) => {
            const status = (payload.new as { account_status?: string }).account_status;
            if (status === "approved") {
              toast.success("Your account has been approved", {
                description: "You can now enter your TeacherHub workspace.",
              });
              void navigate({ to: "/dashboard" });
            }
          },
        )
        .subscribe();
    });

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [navigate]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="surface w-full max-w-md p-8 text-center">
        <Clock3 className="mx-auto size-10 text-primary" />
        <h1 className="mt-5 text-2xl font-semibold">
          {isSuspended ? "Account suspended" : "Request received"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {isSuspended
            ? "Your access to TeacherHub has been suspended. Contact an administrator if you need help."
            : "Your account is waiting for approval. You will be able to enter TeacherHub once an administrator approves it."}
        </p>
        <Button variant="outline" className="mt-6" onClick={signOut} disabled={loading}>
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </div>
    </main>
  );
}
