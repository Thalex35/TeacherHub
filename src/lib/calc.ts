import type { Assessment, EvaluationType, Grade, GradeWeight } from "./types";

export function round(value: number, precision = 2) {
  const f = Math.pow(10, precision);
  return Math.round(value * f) / f;
}

export function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Normalise a raw score onto the configured scale (e.g. /10). */
export function normalise(score: number, maxGrade: number, scale: number) {
  if (!maxGrade) return 0;
  return (score / maxGrade) * scale;
}

export interface TypeBreakdown {
  typeId: string;
  typeName: string;
  weight: number;
  average: number | null;
  count: number;
}

export interface FinalGradeResult {
  breakdown: TypeBreakdown[];
  final: number | null;
  weightUsed: number;
}

/**
 * Computes a student's period grade from their grades using the configured
 * per-evaluation-type weights. Types with no graded work are excluded and the
 * remaining weights are re-normalised, so the result is never artificially low.
 */
export function computeFinalGrade(params: {
  grades: Grade[];
  assessments: Assessment[];
  types: EvaluationType[];
  weights: GradeWeight[];
  scale: number;
  precision?: number;
}): FinalGradeResult {
  const { grades, assessments, types, weights, scale } = params;
  const precision = params.precision ?? 2;
  const byId = new Map(assessments.map((a) => [a.id, a]));

  const breakdown: TypeBreakdown[] = types.map((t) => {
    const w = weights.find((x) => x.evaluation_type_id === t.id);
    const scores: number[] = [];
    for (const g of grades) {
      if (g.score === null) continue;
      const a = byId.get(g.assessment_id);
      if (!a || a.evaluation_type_id !== t.id) continue;
      scores.push(normalise(Number(g.score), Number(a.max_grade), scale));
    }
    const a = avg(scores);
    return {
      typeId: t.id,
      typeName: t.name,
      weight: w ? Number(w.weight) : 0,
      average: a === null ? null : round(a, precision),
      count: scores.length,
    };
  });

  const contributing = breakdown.filter((b) => b.weight > 0 && b.average !== null);
  const weightUsed = contributing.reduce((s, b) => s + b.weight, 0);
  if (!contributing.length || weightUsed === 0) {
    return { breakdown, final: null, weightUsed: 0 };
  }
  const final = contributing.reduce((s, b) => s + b.weight * (b.average as number), 0) / weightUsed;
  return { breakdown, final: round(final, precision), weightUsed };
}

export function attendanceStats(rows: { status: string }[]) {
  const total = rows.length;
  const count = (s: string) => rows.filter((r) => r.status === s).length;
  const present = count("present");
  const late = count("late");
  const excused = count("excused");
  const absent = count("absent");
  const rate = total ? ((present + late + excused) / total) * 100 : null;
  return { total, present, late, excused, absent, rate: rate === null ? null : round(rate, 1) };
}

export function weightsAreValid(weights: { weight: number }[]) {
  const total = weights.reduce((s, w) => s + (Number(w.weight) || 0), 0);
  return { total: round(total, 2), valid: Math.abs(total - 100) < 0.01 };
}
