import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("items-center text-center", className)}>
      <CardHeader className="items-center">
        {Icon ? <Icon className="size-8 text-primary" aria-hidden="true" /> : null}
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      {children ? <CardContent className="flex flex-wrap justify-center gap-3">{children}</CardContent> : null}
    </Card>
  );
}
