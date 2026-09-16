import { recordActivity } from "@/lib/account";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  ExternalLink,
  Headphones,
  Lightbulb,
  LayoutDashboard,
  LogOut,
  Moon,
  ShieldCheck,
  Settings2,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/access-requests", label: "Access requests", icon: ShieldCheck },
  { to: "/admin/feature-requests", label: "Feature requests", icon: Lightbulb },
  { to: "/admin/help-support", label: "Help & support", icon: Headphones },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem("teacherhub-admin-theme") === "dark");

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("teacherhub-admin-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const heartbeat = () => void recordActivity("app_access");
    const handleVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    const interval = window.setInterval(heartbeat, 60_000);
    heartbeat();
    window.addEventListener("focus", heartbeat);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", heartbeat);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  return (
    <div className="admin-workspace min-h-screen">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-sidebar-border px-3 py-5 text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-3 pb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]">
            TeacherHub
          </p>
          <h1 className="mt-2 font-display text-lg font-semibold">Admin workspace</h1>
          <p className="mt-1 text-xs">Platform operations</p>
        </div>

        <nav className="mt-5 flex-1 space-y-1" aria-label="Admin navigation">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="admin-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className: "admin-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-accent-foreground font-medium",
                "data-status": "active",
              }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border pt-4">
          <Button variant="ghost" className="w-full justify-start gap-3 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" onClick={toggleTheme}>
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {dark ? "Use light theme" : "Use dark theme"}
          </Button>
          <Link
            to="/settings"
              className="admin-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Settings2 className="size-4 shrink-0" />
            Workspace settings
            <ExternalLink className="ml-auto size-3.5 opacity-60" />
          </Link>
          <Button
            variant="ghost"
            className="mt-1 w-full justify-start gap-3 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => void navigate({ to: "/dashboard" })}
          >
            <LayoutDashboard className="size-4" />
            Back to TeacherHub
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="admin-mobile-header sticky top-0 z-30 border-b border-border px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display font-semibold">Admin workspace</p>
              <p className="text-xs text-muted-foreground">TeacherHub platform operations</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={toggleTheme} aria-label={dark ? "Use light theme" : "Use dark theme"}>
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void navigate({ to: "/dashboard" })}>
                Exit admin
              </Button>
            </div>
          </div>
          <nav className="mt-3 grid grid-cols-2 gap-2" aria-label="Admin navigation">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground"
                activeProps={{ className: "border-primary bg-primary/10 text-primary font-medium" }}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
