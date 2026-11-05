import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { parts } from "@/parts/manifest";
import { part } from "@/parts/part";

const sizes = parts.control.style ?? {};

export type ButtonProps = Readonly<
  ComponentProps<"button"> & {
    /** `solid` is spent once per screen, on the one action that matters. */
    variant?: "solid" | "outline" | "ghost";
    /** 24 / 28 / 32px: inside a title line, in a dense row, everywhere else. */
    size?: "small" | "dense" | "regular";
  }
>;

export function Button({
  className,
  variant = "outline",
  size = "regular",
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-control font-medium transition-colors disabled:opacity-50",
        variant === "solid" && "bg-ink text-on-ink hover:opacity-90",
        variant === "outline" &&
          "border border-line bg-surface text-ink hover:bg-hover",
        variant === "ghost" && "text-ink-2 hover:bg-hover hover:text-ink",
        sizes[size],
        className,
      )}
      {...part("control")}
      {...props}
    />
  );
}
