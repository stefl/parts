import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { part } from "@/parts/part";

export type FieldProps = Readonly<
  ComponentProps<"input"> & {
    label: string;
    id: string;
  }
>;

/** A labelled text field, 32px high like the buttons on the same form. */
export function Field({ label, id, className, ...props }: FieldProps) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1" {...part("field")}>
      <span className="text-meta text-ink-3">{label}</span>
      <input
        id={id}
        className={cn(
          "h-8 rounded-control border border-line bg-surface px-3 text-data text-ink placeholder:text-ink-3",
          className,
        )}
        {...part("control", { place: "field" })}
        {...props}
      />
    </label>
  );
}
