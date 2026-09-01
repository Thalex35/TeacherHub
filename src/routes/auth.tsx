import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

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
    if (error) { toast.error(error.message); return; }
    void navigate({ to: "/dashboard" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) return void navigate({ to: "/dashboard" });
    toast.success("Account created. Check your inbox to confirm your email.");
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) { toast.error("Google sign-in failed. Please try again."); return; }
    if (result.redirected) return;
    void navigate({ to: "/dashboard" });
  };

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
          <Tabs defaultValue="signin">
            <TabsList className="mb-4 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <Field id="email" label="Email" value={email} onChange={setEmail} type="email" />
                <Field
                  id="password"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <Field
                  id="email2"
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                />
                <Field
                  id="password2"
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  type="password"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
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
