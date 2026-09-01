export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatScore(value: number | null | undefined, scale = 10, precision = 2) {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toFixed(precision).replace(/\.?0+$/, "")}/${scale}`;
}

export function fullName(s: { first_name: string; last_name: string }) {
  return `${s.first_name} ${s.last_name}`;
}

export function titleCase(v: string) {
  return v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
