import type { ReactNode } from "react";
import { part } from "@/parts/part";

/** One thing shown in full: one fill level, a line edge and a soft lift, and
 * nothing filled inside it. */
export function Card({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <article
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card"
      {...part("card")}
    >
      {children}
    </article>
  );
}
