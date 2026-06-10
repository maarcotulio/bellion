import { BookOpen, Dices, Home, Swords } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/library", label: "Library", icon: BookOpen },
  { href: "/dice", label: "Dice", icon: Dices },
  { href: "/combat", label: "Combat", icon: Swords },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
        <Link href="/" className="font-display text-xl font-semibold tracking-wide text-foreground">
          Royal Bellion
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-muted hover:text-primary sm:text-sm"
            >
              <item.icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
