import type { ReactNode } from "react";
import { part } from "@/parts/part";

/** A section of a page: a heading and what it introduces, 16px apart. */
export function Band({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <section className="flex flex-col gap-4" {...part("band")}>
      {children}
    </section>
  );
}

/** Words that introduce what follows. Inside a band over a list the heading
 * takes the rows' inset as a margin, so its box starts on the titles' edge. */
export function Heading({
  children,
  inset = false,
}: Readonly<{ children: ReactNode; inset?: boolean }>) {
  return (
    <h2
      className={inset ? "mx-3 text-title text-ink" : "text-title text-ink"}
      {...part("heading")}
    >
      {children}
    </h2>
  );
}
