"use client";

import type { ComponentProps } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CheckboxFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly className?: string;
} & Omit<ComponentProps<typeof Checkbox>, "checked" | "onCheckedChange" | "id">;

export function CheckboxField({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}: CheckboxFieldProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        {...props}
      />
      <Label htmlFor={id} className="cursor-pointer font-normal text-foreground">
        {label}
      </Label>
    </div>
  );
}
