import { Link, useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  NotebookPen,
  Settings as SettingsIcon,
  Table2,
  UserCheck,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSettings } from "@/lib/data";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users },
  { to: "/classes", label: "Classes", icon: GraduationCap },
  { to: "/curriculum", label: "Curriculum", icon: BookOpen },
  { to: "/planner", label: "Lesson Planner", icon: NotebookPen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/gradebook", label: "Gradebook", icon: Table2 },
  { to: "/attendance", label: "Attendance", icon: UserCheck },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/evaluations", label: "Evaluations", icon: ListChecks },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: settings } = useSettings();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
          <div className="grid size-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold">TeacherHub</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {settings?.school_name ?? "School"}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium hover:bg-sidebar-accent",
              }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-3">
          <p className="px-3 pb-2 text-xs text-sidebar-foreground/60">
            {settings?.teacher_name ?? "Teacher"}
          </p>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="size-4" /> Sign out
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
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
