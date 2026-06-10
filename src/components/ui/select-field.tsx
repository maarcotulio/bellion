import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SelectFieldProps = {
  readonly id?: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly children: ReactNode;
  readonly className?: string;
};

export function SelectField({
  id,
  label,
  value,
  onChange,
  children,
  className,
}: SelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={fieldId} className="font-mono text-muted-foreground">
        {label}
      </Label>
      <select
        id={fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field-input"
      >
        {children}
      </select>
    </div>
  );
}
