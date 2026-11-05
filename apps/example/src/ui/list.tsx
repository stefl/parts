import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parts } from "@/parts/manifest";
import { part } from "@/parts/part";

// An open list: space, not lines, and a neutral rounded hover that meets no
// edge. Bordered groups belong to settings screens.

export function List({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ul className="flex flex-col" {...part("list")}>
      {children}
    </ul>
  );
}

/** Names a run of rows. Its padding equals the row's, so its words start on
 * the titles' edge. */
export function GroupLabel({
  children,
  count,
}: Readonly<{ children: ReactNode; count?: number }>) {
  return (
    <li
      className={cn(
        "text-data font-medium text-ink-2",
        parts["list.group-label"].style?.label,
      )}
      {...part("list.group-label")}
    >
      {children}
      {count === undefined ? null : (
        <span className="text-ink-3"> · {count}</span>
      )}
    </li>
  );
}

export type RowProps = Readonly<{
  title: ReactNode;
  /** A quiet second line. */
  meta?: ReactNode;
  /** A control on the row's right, 28px high. */
  action?: ReactNode;
  selected?: boolean;
}>;

export function Row({ title, meta, action, selected = false }: RowProps) {
  return (
    <li
      className={cn(
        "flex items-start rounded-row",
        parts.row.style?.row,
        selected ? "bg-panel" : "hover:bg-hover",
      )}
      {...part("row")}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-data text-ink" {...part("row.title")}>
          {title}
        </div>
        {meta === undefined ? null : (
          <div
            className="truncate text-meta text-ink-3"
            {...part("row.meta", { "row-sub": "true" })}
          >
            {meta}
          </div>
        )}
      </div>
      {action}
    </li>
  );
}
