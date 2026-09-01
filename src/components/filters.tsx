import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const ALL = "__all__";

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "All",
  includeAll = true,
  className = "w-[170px]",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  includeAll?: boolean;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs text-muted-foreground">{label}</Label> : null}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {includeAll ? <SelectItem value={ALL}>{placeholder}</SelectItem> : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
      {children}
    </div>
  );
}
