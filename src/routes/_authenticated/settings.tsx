import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { weightsAreValid } from "@/lib/calc";
import {
  useEvaluationTypes,
  useGradeWeights,
  useInsert,
  usePeriods,
  useRemove,
  useSettings,
  useUpdate,
  useUpsert,
  useYears,
} from "@/lib/data";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TeacherHub" },
      {
        name: "description",
        content: "School details, academic years and periods, grading scale and evaluation weights.",
      },
      { property: "og:title", content: "Settings — TeacherHub" },
      { property: "og:description", content: "Configure grading rules and academic structure." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useSettings();
  const years = useYears();
  const periods = usePeriods();
  const types = useEvaluationTypes();
  const weights = useGradeWeights();

  const updateSettings = useUpdate("app_settings");
  const upsertWeights = useUpsert("grade_weights", "period_id,evaluation_type_id");
  const insertType = useInsert("evaluation_types");
  const removeType = useRemove("evaluation_types");
  const insertYear = useInsert("academic_years");
  const insertPeriod = useInsert("academic_periods");
  const removePeriod = useRemove("academic_periods");

  const s = settings.data;
  const [general, setGeneral] = useState({
    school_name: "",
    school_info: "",
    teacher_name: "",
    default_max_grade: "10",
    decimal_precision: "2",
    allow_grade_override: true,
    current_year_id: "",
    current_period_id: "",
  });

  useEffect(() => {
    if (!s) return;
    setGeneral({
      school_name: s.school_name,
      school_info: s.school_info ?? "",
      teacher_name: s.teacher_name,
      default_max_grade: String(s.default_max_grade),
      decimal_precision: String(s.decimal_precision),
      allow_grade_override: s.allow_grade_override,
      current_year_id: s.current_year_id ?? "",
      current_period_id: s.current_period_id ?? "",
    });
  }, [s]);

  const saveGeneral = async () => {
    if (!s) return;
    const max = Number(general.default_max_grade);
    if (!max || max <= 0) { toast.error("The maximum grade must be greater than 0."); return; }
    await updateSettings.mutateAsync({
      id: String(s.id),
      values: {
        school_name: general.school_name.trim() || "My School",
        school_info: general.school_info || null,
        teacher_name: general.teacher_name.trim() || "Teacher",
        default_max_grade: max,
        decimal_precision: Number(general.decimal_precision) || 0,
        allow_grade_override: general.allow_grade_override,
        current_year_id: general.current_year_id || null,
        current_period_id: general.current_period_id || null,
      },
    });
    toast.success("Settings saved.");
  };

  // Grade weights (global defaults: period_id null)
  const [weightDraft, setWeightDraft] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const t of types.data ?? []) {
      const w = (weights.data ?? []).find(
        (x) => x.evaluation_type_id === t.id && x.period_id === null,
      );
      next[t.id] = String(w ? Number(w.weight) : 0);
    }
    setWeightDraft(next);
  }, [types.data, weights.data]);

  const weightTotal = Object.values(weightDraft).reduce((a, b) => a + (Number(b) || 0), 0);

  const saveWeights = async () => {
    const rows = (types.data ?? []).map((t) => ({
      period_id: null,
      evaluation_type_id: t.id,
      weight: Number(weightDraft[t.id]) || 0,
    }));
    const check = weightsAreValid(rows);
    if (!check.valid)
      { toast.error(`Weights must add up to 100 (currently ${check.total}).`); return; }
    await upsertWeights.mutateAsync(rows);
    toast.success("Grading weights saved.");
  };

  const [typeName, setTypeName] = useState("");
  const addType = async () => {
    if (!typeName.trim()) { toast.error("Enter a name for the evaluation type."); return; }
    await insertType.mutateAsync({
      name: typeName.trim(),
      code: typeName.trim().toLowerCase().replace(/\s+/g, "_"),
    });
    setTypeName("");
    toast.success("Evaluation type added.");
  };

  const [yearForm, setYearForm] = useState({ name: "", start_date: "", end_date: "" });
  const addYear = async () => {
    if (!yearForm.name.trim() || !yearForm.start_date || !yearForm.end_date)
      { toast.error("Name, start and end dates are required."); return; }
    if (yearForm.end_date <= yearForm.start_date)
      { toast.error("The end date must be after the start date."); return; }
    await insertYear.mutateAsync({ ...yearForm, name: yearForm.name.trim() });
    setYearForm({ name: "", start_date: "", end_date: "" });
    toast.success("Academic year added.");
  };

  const [periodForm, setPeriodForm] = useState({
    name: "",
    academic_year_id: "",
    start_date: "",
    end_date: "",
  });
  const addPeriod = async () => {
    const yearId = periodForm.academic_year_id || years.data?.[0]?.id;
    if (!periodForm.name.trim() || !yearId || !periodForm.start_date || !periodForm.end_date)
      { toast.error("Fill in every field to add a period."); return; }
    if (periodForm.end_date <= periodForm.start_date)
      { toast.error("The end date must be after the start date."); return; }
    await insertPeriod.mutateAsync({
      name: periodForm.name.trim(),
      academic_year_id: yearId,
      start_date: periodForm.start_date,
      end_date: periodForm.end_date,
      sort_order: (periods.data ?? []).length + 1,
    });
    setPeriodForm({ name: "", academic_year_id: "", start_date: "", end_date: "" });
    toast.success("Academic period added.");
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="School identity, academic structure and the rules used to calculate grades."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>School &amp; teacher</CardTitle>
            <CardDescription>Shown on reports and printed documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>School name</Label>
                <Input
                  value={general.school_name}
                  onChange={(e) => setGeneral({ ...general, school_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Teacher name</Label>
                <Input
                  value={general.teacher_name}
                  onChange={(e) => setGeneral({ ...general, teacher_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>School information</Label>
              <Textarea
                rows={2}
                value={general.school_info}
                onChange={(e) => setGeneral({ ...general, school_info: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Grading scale (max grade)</Label>
                <Input
                  inputMode="numeric"
                  value={general.default_max_grade}
                  onChange={(e) => setGeneral({ ...general, default_max_grade: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Decimal places</Label>
                <Select
                  value={general.decimal_precision}
                  onValueChange={(v) => setGeneral({ ...general, decimal_precision: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3"].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Current academic year</Label>
                <Select
                  value={general.current_year_id}
                  onValueChange={(v) => setGeneral({ ...general, current_year_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {(years.data ?? []).map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Current period</Label>
                <Select
                  value={general.current_period_id}
                  onValueChange={(v) => setGeneral({ ...general, current_period_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {(periods.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Allow manual final grade overrides</p>
                <p className="text-xs text-muted-foreground">
                  Lets you replace a calculated final grade in the gradebook.
                </p>
              </div>
              <Switch
                checked={general.allow_grade_override}
                onCheckedChange={(v) => setGeneral({ ...general, allow_grade_override: v })}
              />
            </div>
            <Button onClick={saveGeneral} disabled={updateSettings.isPending}>
              Save settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading weights</CardTitle>
            <CardDescription>
              Weight of each evaluation type in the final grade. Must total 100.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(types.data ?? []).map((t) => (
              <div key={t.id} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{t.name}</span>
                <Input
                  className="w-24"
                  inputMode="numeric"
                  value={weightDraft[t.id] ?? "0"}
                  onChange={(e) => setWeightDraft({ ...weightDraft, [t.id]: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">%</span>
                {t.is_system ? null : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${t.name}"?`)) return;
                      await removeType.mutateAsync(t.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Badge variant={weightTotal === 100 ? "secondary" : "destructive"}>
                Total {weightTotal}%
              </Badge>
              <Button onClick={saveWeights} disabled={upsertWeights.isPending}>
                Save weights
              </Button>
            </div>
            <div className="flex gap-2 border-t border-border pt-4">
              <Input
                placeholder="New evaluation type"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
              />
              <Button variant="outline" onClick={addType}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic years</CardTitle>
            <CardDescription>Each year holds its own periods and classes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(years.data ?? []).map((y) => (
                  <TableRow key={y.id}>
                    <TableCell className="font-medium">{y.name}</TableCell>
                    <TableCell>{formatDate(y.start_date)}</TableCell>
                    <TableCell>{formatDate(y.end_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-2 sm:grid-cols-4">
              <Input
                placeholder="2026–2027"
                value={yearForm.name}
                onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
              />
              <Input
                type="date"
                value={yearForm.start_date}
                onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
              />
              <Input
                type="date"
                value={yearForm.end_date}
                onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
              />
              <Button variant="outline" onClick={addYear}>
                <Plus className="size-4" /> Add year
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Academic periods</CardTitle>
            <CardDescription>Terms, semesters or trimesters used for final grades.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(periods.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.start_date)} – {formatDate(p.end_date)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          if (!window.confirm(`Delete "${p.name}"?`)) return;
                          await removePeriod.mutateAsync(p.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Term 3"
                value={periodForm.name}
                onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
              />
              <Select
                value={periodForm.academic_year_id || years.data?.[0]?.id || ""}
                onValueChange={(v) => setPeriodForm({ ...periodForm, academic_year_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Academic year" />
                </SelectTrigger>
                <SelectContent>
                  {(years.data ?? []).map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={periodForm.start_date}
                onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
              />
              <Input
                type="date"
                value={periodForm.end_date}
                onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
              />
            </div>
            <Button variant="outline" onClick={addPeriod}>
              <Plus className="size-4" /> Add period
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
