import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type BackLinkProps = {
  readonly href: string;
  readonly label: string;
};

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-mono text-sm text-primary transition-colors hover:text-accent"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
