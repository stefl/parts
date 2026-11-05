import { createElement, type ReactNode } from "react";
import { part } from "@/parts/part";

/** What is not there yet, in one line where the content would have started.
 * No box, no icon, no centring. Inside a list it is an `li`, so the list
 * stays a list to a screen reader. */
export function EmptyState({
  title,
  description,
  as = "p",
}: Readonly<{ title: string; description?: ReactNode; as?: "p" | "li" }>) {
  const stop = /[.!?]$/.test(title) ? "" : ".";
  return createElement(
    as,
    { className: "text-data text-ink-3", ...part("empty") },
    <span className="text-ink-2">{title}</span>,
    description === undefined ? null : (
      <>
        {stop} {description}
      </>
    ),
  );
}
