import Link from "next/link";
import { Calculator } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Calculator className="h-4 w-4" />
          </span>
          UK Tax Calculator
        </Link>
        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Calculator</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <a href="/scalar" target="_blank" rel="noreferrer">
              API docs
            </a>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
