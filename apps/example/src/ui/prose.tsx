import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parts } from "@/parts/manifest";
import { part } from "@/parts/part";

/** Running text on the reading measure. */
export function Prose({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <p
      className={cn(parts.prose.style?.copy, "text-ink-2", className)}
      {...part("prose")}
    >
      {children}
    </p>
  );
}
