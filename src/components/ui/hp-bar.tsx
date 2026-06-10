"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type HpBarProps = {
  readonly current: number;
  readonly max: number;
  readonly size?: "sm" | "md";
  readonly className?: string;
};

function getBarColor(percent: number) {
  if (percent > 60) {
    return "bg-primary";
  }

  if (percent > 30) {
    return "bg-accent";
  }

  return "bg-destructive";
}

export function HpBar({ current, max, size = "md", className }: HpBarProps) {
  const previousHp = useRef(current);
  const [impact, setImpact] = useState(false);
  const percent = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;

  useEffect(() => {
    if (current < previousHp.current) {
      setImpact(true);
      const timer = window.setTimeout(() => setImpact(false), 450);

      previousHp.current = current;

      return () => window.clearTimeout(timer);
    }

    previousHp.current = current;
  }, [current]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-background",
        size === "sm" ? "h-2" : "h-3",
        impact && "animate-hp-impact",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          getBarColor(percent),
          impact && "shadow-[0_0_16px_rgba(220,54,69,0.55)]",
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
