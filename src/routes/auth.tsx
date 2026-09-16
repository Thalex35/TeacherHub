import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Chrome, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { recordActivity } from "@/lib/account";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TeacherHub" },
      { name: "description", content: "Sign in to your TeacherHub teacher workspace." },
      { property: "og:title", content: "Sign in — TeacherHub" },
      { property: "og:description", content: "Private teacher workspace sign-in." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    void recordActivity("login");
    void navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) void navigate({ to: "/pending" });
    else toast.success("Account created. Check your inbox to confirm your email.");
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setLoading(false);
      toast.error(error.message);
    }
  };

  // Single-user mode: keep original sign-up flow commented out for later re-enablement.
  // const signUp = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   const { data, error } = await supabase.auth.signUp({
  //     email,
  //     password,
  //     options: { emailRedirectTo: window.location.origin },
  //   });
  //   setLoading(false);
  //   if (error) { toast.error(error.message); return; }
  //   if (data.session) return void navigate({ to: "/dashboard" });
  //   toast.success("Account created. Check your inbox to confirm your email.");
  // };

  // Single-user mode: keep original Google flow commented out for later re-enablement.
  // const google = async () => {
  //   const result = await lovable.auth.signInWithOAuth("google", {
  //     redirect_uri: window.location.origin,
  //   });
  //   if (result.error) { toast.error("Google sign-in failed. Please try again."); return; }
  //   if (result.redirected) return;
  //   void navigate({ to: "/dashboard" });
  // };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">TeacherHub</h1>
            <p className="text-sm text-muted-foreground">Private teacher workspace</p>
          </div>
        </div>

        <div className="surface p-6">
          <div className="mb-4 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {isRegistering ? "Request access" : "Sign in"}
          </div>

          <form onSubmit={isRegistering ? signUp : signIn} className="space-y-4">
            {isRegistering ? (
              <Field
                id="full-name"
                label="Full name"
                value={fullName}
                onChange={setFullName}
                type="text"
              />
            ) : null}
            <Field id="email" label="Email" value={email} onChange={setEmail} type="email" />
            <Field
              id="password"
              label="Password"
              value={password}
              onChange={setPassword}
              type="password"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {isRegistering ? "Request access" : "Sign in"}
            </Button>
            {!isRegistering ? (
              <>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={() => void signInWithGoogle()}
                >
                  <Chrome className="mr-2 size-4" /> Continue with Google
                </Button>
              </>
            ) : null}
            <button
              type="button"
              className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setIsRegistering((value) => !value)}
            >
              {isRegistering
                ? "Already have an account? Sign in"
                : "Need an account? Request access"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required
        autoComplete={type === "password" ? "current-password" : "email"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
