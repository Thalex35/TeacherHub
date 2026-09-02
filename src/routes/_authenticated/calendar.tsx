import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useClasses, useEvents, useInsert, useRemove, useSubjects, useUpdate } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import { EVENT_TYPES, type CalendarEvent } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/calendar")({
  validateSearch: z.object({ date: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Calendar — TeacherHub" },
      { name: "description", content: "Month, week and day views of classes, quizzes and exams." },
      { property: "og:title", content: "Calendar — TeacherHub" },
      { property: "og:description", content: "Plan your teaching calendar." },
    ],
  }),
  component: CalendarPage,
});

const NONE = "__none__";
const iso = (d: Date) => d.toISOString().slice(0, 10);

function CalendarPage() {
  const { date } = Route.useSearch();
  const events = useEvents();
  const classes = useClasses();
  const subjects = useSubjects();
  const insert = useInsert("calendar_events");
  const update = useUpdate("calendar_events");
  const remove = useRemove("calendar_events");

  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [cursor, setCursor] = useState(() => (date ? new Date(`${date}T00:00:00`) : new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: iso(new Date()),
    start_time: "08:00",
    end_time: "10:00",
    class_id: NONE,
    event_type: "class",
  });

  const all = events.data ?? [];

  useEffect(() => {
    if (date) setCursor(new Date(`${date}T00:00:00`));
  }, [date]);

  const range = () => {
    const d = new Date(cursor);
    if (view === "day") return { start: iso(d), end: iso(d) };
    if (view === "week") {
      const start = new Date(d);
      start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: iso(start), end: iso(end) };
    }
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return { start: iso(start), end: iso(end) };
  };

  const { start, end } = range();
  const visible = all
    .filter((e) => e.event_date >= start && e.event_date <= end)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const shift = (dir: -1 | 1) => {
    const d = new Date(cursor);
    if (view === "day") d.setDate(d.getDate() + dir);
    else if (view === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const openNew = (date?: string) => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      event_date: date ?? iso(cursor),
      start_time: "08:00",
      end_time: "10:00",
      class_id: NONE,
      event_type: "class",
    });
    setOpen(true);
  };

  const openEdit = (e: CalendarEvent) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description ?? "",
      event_date: e.event_date,
      start_time: e.start_time?.slice(0, 5) ?? "",
      end_time: e.end_time?.slice(0, 5) ?? "",
      class_id: e.class_id ?? NONE,
      event_type: e.event_type,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("A title is required."); return; }
    if (!form.event_date) { toast.error("A date is required."); return; }
    if (form.start_time && form.end_time && form.end_time <= form.start_time)
      { toast.error("End time must be after the start time."); return; }
    const klass = classes.data?.find((c) => c.id === form.class_id);
    const values = {
      title: form.title.trim(),
      description: form.description || null,
      event_date: form.event_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      class_id: form.class_id === NONE ? null : form.class_id,
      subject_id: klass?.subject_id ?? subjects.data?.[0]?.id ?? null,
      event_type: form.event_type,
    };
    if (editing) await update.mutateAsync({ id: editing.id, values });
    else await insert.mutateAsync(values);
    toast.success("Event saved.");
    setOpen(false);
  };

  const del = async (e: CalendarEvent) => {
    if (!window.confirm(`Delete "${e.title}"?`)) return;
    await remove.mutateAsync(e.id);
    toast.success("Event deleted.");
  };

  const monthCells = () => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let i = 1; i <= days; i++)
      cells.push(iso(new Date(cursor.getFullYear(), cursor.getMonth(), i)));
    return cells;
  };

  const label =
    view === "month"
      ? cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `${formatDate(start)} – ${formatDate(end)}`
        : formatDate(start);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Sessions, quizzes, tests, exams and other events."
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="size-4" /> New event
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[220px] text-center font-medium">{label}</span>
          <Button variant="outline" size="icon" onClick={() => shift(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "day" ? (
        <div className="mb-3">
          <Button variant="outline" size="sm" onClick={() => setView("month")}>
            <ArrowLeft className="size-4" /> Back to calendar
          </Button>
        </div>
      ) : null}

      {view === "month" ? (
        <div className="surface overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted text-xs font-medium text-muted-foreground">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 py-2 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthCells().map((day, i) => (
              <div
                key={i}
                className="min-h-24 cursor-pointer border-b border-r border-border p-1.5 transition-colors hover:bg-muted/50 last:border-r-0"
                role={day ? "button" : undefined}
                tabIndex={day ? 0 : undefined}
                onClick={() => {
                  if (!day) return;
                  setCursor(new Date(`${day}T00:00:00`));
                  setView("day");
                }}
                onKeyDown={(event) => {
                  if (!day || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  setCursor(new Date(`${day}T00:00:00`));
                  setView("day");
                }}
                onDoubleClick={() => day && openNew(day)}
              >
                {day ? (
                  <>
                    <p className="numeric mb-1 text-xs text-muted-foreground">
                      {Number(day.slice(-2))}
                    </p>
                    <div className="space-y-1">
                      {all
                        .filter((e) => e.event_date === day)
                        .slice(0, 3)
                        .map((e) => (
                          <button
                            key={e.id}
                            onClick={() => openEdit(e)}
                            className="block w-full truncate rounded bg-secondary px-1.5 py-0.5 text-left text-xs text-secondary-foreground hover:bg-accent"
                          >
                            {e.title}
                          </button>
                        ))}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events in this range"
          description="Create an event to fill your teaching calendar."
          action={<Button onClick={() => openNew()}>New event</Button>}
        />
      ) : (
        <div className="space-y-2">
          {visible.map((e) => (
            <div key={e.id} className="surface flex flex-wrap items-center gap-3 p-3">
              <div className="min-w-32">
                <p className="text-sm font-medium">{formatDate(e.event_date)}</p>
                <p className="numeric text-xs text-muted-foreground">
                  {e.start_time?.slice(0, 5) ?? "—"} – {e.end_time?.slice(0, 5) ?? "—"}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{e.title}</p>
                <p className="truncate text-xs text-muted-foreground">{e.description}</p>
              </div>
              <Badge variant="secondary">{titleCase(e.event_type)}</Badge>
              <Badge variant="outline">
                {classes.data?.find((c) => c.id === e.class_id)?.name ?? "All classes"}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => openEdit(e)}>
                <Pencil className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => del(e)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit event" : "New event"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>End</Label>
                <Input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select
                  value={form.class_id}
                  onValueChange={(v) => setForm({ ...form, class_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>All classes</SelectItem>
                    {(classes.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Event type</Label>
                <Select
                  value={form.event_type}
                  onValueChange={(v) => setForm({ ...form, event_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {titleCase(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
