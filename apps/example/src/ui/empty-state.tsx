import type { ReactNode } from "react";
import { part } from "@/parts/part";

/** What is not there yet, in one line where the content would have started.
 * No box, no icon, no centring. */
export function EmptyState({
  title,
  description,
}: Readonly<{ title: string; description?: ReactNode }>) {
  const stop = /[.!?]$/.test(title) ? "" : ".";
  return (
    <p className="text-data text-ink-3" {...part("empty")}>
      <span className="text-ink-2">{title}</span>
      {description === undefined ? null : (
        <>
          {stop} {description}
        </>
      )}
    </p>
  );
}
