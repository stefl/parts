import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { part } from "@/parts/part";

/** A strip of tabs with room for one control on the right. The 1px rule is
 * the bar's own, so it runs under the control as well as the tabs. */
export function Bar({
  tabs,
  control,
}: Readonly<{ tabs: ReactNode; control?: ReactNode }>) {
  return (
    <div
      className="flex items-end justify-between border-b border-line"
      {...part("bar")}
    >
      {tabs}
      {control}
    </div>
  );
}

export type Tab = Readonly<{ label: string; count?: number }>;

export function Tabs({
  tabs,
  current,
}: Readonly<{ tabs: readonly Tab[]; current: string }>) {
  return (
    <div role="tablist" className="flex">
      {tabs.map((tab) => {
        const selected = tab.label === current;
        return (
          <button
            key={tab.label}
            type="button"
            role="tab"
            aria-selected={selected}
            data-part="control"
            // The current tab is marked by weight and a 2px underline. The
            // underline is an inset shadow, not a border, so it does not
            // read as a second, shorter rule under the bar.
            className={cn(
              "h-8 whitespace-nowrap px-2 text-data transition-colors first:pl-0 last:pr-0",
              selected
                ? "font-medium text-ink shadow-[inset_0_-2px_0_var(--color-ink)]"
                : "text-ink-3 hover:text-ink-2",
            )}
          >
            {tab.label}
            {tab.count === undefined ? null : (
              <span className="text-ink-3 tabular-nums"> {tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
