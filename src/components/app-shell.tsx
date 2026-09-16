import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Menu,
  NotebookPen,
  Settings as SettingsIcon,
  ShieldCheck,
  Table2,
  UserCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EventNotifications } from "@/components/event-notifications";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { getAccountProfile } from "@/lib/account";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/students", key: "students", icon: Users },
  { to: "/classes", key: "classes", icon: GraduationCap },
  { to: "/calendar", key: "calendar", icon: CalendarDays },
  { to: "/attendance", key: "attendance", icon: UserCheck },
] as const;

const MANAGEMENT_NAV = [
  { to: "/curriculum", key: "curriculum", icon: BookOpen },
  { to: "/planner", key: "planner", icon: NotebookPen },
  { to: "/assignments", key: "assignments", icon: ClipboardList },
  { to: "/gradebook", key: "gradebook", icon: Table2 },
  { to: "/evaluations", key: "evaluations", icon: ListChecks },
  { to: "/reports", key: "reports", icon: FileBarChart },
] as const;

const SETTINGS_NAV = [{ to: "/settings", label: "Settings", icon: SettingsIcon }] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileName, setProfileName] = useState("");
  const { data: settings } = useSettings();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const theme = localStorage.getItem("teacherhub-user-theme");
    const dark = theme === "dark" || (theme !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const profile = await getAccountProfile(data.user.id);
      setIsAdmin(profile?.role === "admin" && profile.account_status === "approved");
      setProfileName(profile?.full_name ?? "");
    });
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[12px_0_40px_oklch(0.12_0.03_250_/_0.08)] transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
          <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-black/15">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold">TeacherHub</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {settings?.school_name ?? "School"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {NAV.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${index * 35}ms` }}
                className="page-enter flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
                }}
              >
                <item.icon className="size-4 shrink-0" />
                {t(item.key)}
              </Link>
            ))}
          </div>

          <div className="space-y-1">
            <p className="px-3 text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/50">
              {t("management")}
            </p>
            {MANAGEMENT_NAV.map((item, index) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${(index + NAV.length) * 35}ms` }}
                className="page-enter flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
                }}
              >
                <item.icon className="size-4 shrink-0" />
                {t(item.key)}
              </Link>
            ))}
          </div>

          <div className="space-y-0.5 pt-1">
            {SETTINGS_NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
                }}
              >
                <item.icon className="size-4 shrink-0" />
                {t("settings")}
              </Link>
            ))}
          </div>

          {isAdmin ? (
            <div className="space-y-0.5 pt-1">
              <Link
                to="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/72 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
                }}
              >
                <ShieldCheck className="size-4 shrink-0" />
                {t("admin")}
              </Link>
            </div>
          ) : null}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent"
            onClick={() => void navigate({ to: "/profile" })}
            aria-label={t("myProfile")}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              {(profileName || settings?.teacher_name || "T").slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-sidebar-foreground">
                {profileName || settings?.teacher_name || "Teacher"}
              </span>
              <span className="block text-xs text-sidebar-foreground/60">{t("myProfile")}</span>
            </span>
            <UserCircle className="size-4 text-sidebar-foreground/70" />
          </button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-display font-semibold">TeacherHub</span>
        </header>
        <main className="page-enter mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-5 flex justify-end">
            <EventNotifications />
          </div>
          {children}
        </main>
      </div>

    </div>
  );
}
