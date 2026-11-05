// The source-side twin of the unclassified count: a JSX tag whose className
// carries a margin, padding, gap or space utility and declares no part.
// Catches undeclared layout in seconds, before a story renders. Reads class
// names, so it pairs with the class-name layout detector; a project on the
// computed-style detector has no source-side equivalent and relies on the
// rendered count alone.
import { LAYOUT_TOKEN } from "../walk/layout-detector";

export type Finding = Readonly<{ line: number; message: string }>;

export type UndeclaredLayoutOptions = Readonly<{
  /** The part attribute (config.ts). */
  attribute?: string;
  /** Components whose ROOT element carries the part attribute, so a
   * className on them lands on a declared box: `Stack`, `Row`, `Button`.
   * A component that forwards className to an unmarked wrapper is not one.
   * Kept as a list, not a lookup of the registry: this check reads source. */
  primitives?: ReadonlySet<string>;
  /** The marker that excuses one line, with a reason after it. Default
   * `layout-ok`, written as `// layout-ok <reason>`. */
  marker?: string;
  pattern?: RegExp;
}>;

const JSX_OPEN = /<[A-Za-z][\w.]*(?=[\s/>])/g;
const CLASS_TOKEN = /[^\s"'`{},]+/g;

const blank = (text: string): string => text.replaceAll(/[^\n]/g, " ");

function commentEnd(source: string, i: number): number {
  const pair = source.slice(i, i + 2);
  if (pair === "//") {
    const end = source.indexOf("\n", i);
    return end < 0 ? source.length : end;
  }
  if (pair === "/*") {
    const end = source.indexOf("*/", i + 2);
    return end < 0 ? source.length : end + 2;
  }
  return i;
}

function stringEnd(source: string, i: number): number {
  const quote = source[i];
  let j = i + 1;
  while (j < source.length && source[j] !== quote) {
    if (source[j] === "\\") j++;
    else if (source[j] === "\n" && quote !== "`") break;
    j++;
  }
  return Math.min(source.length, j + 1);
}

/** The source with every comment blanked to spaces (line numbers kept). */
export function stripComments(source: string): string {
  let out = "";
  let i = 0;
  while (i < source.length) {
    const ch = source[i] as string;
    const comment = commentEnd(source, i);
    if (comment > i) {
      out += blank(source.slice(i, comment));
      i = comment;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      const stop = stringEnd(source, i);
      out += source.slice(i, stop);
      i = stop;
    } else {
      out += ch;
      i++;
    }
  }
  return out;
}

function tagEnd(code: string, start: number): number {
  let depth = 0;
  let quote = "";
  for (let i = start; i < code.length; i++) {
    const c = code[i] as string;
    if (quote !== "") {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}") depth--;
    else if (c === ">" && depth === 0) return i + 1;
  }
  return -1;
}

function valueEnd(tag: string, from: number): number {
  const first = tag[from];
  if (first === '"' || first === "'") {
    const close = tag.indexOf(first, from + 1);
    return close < 0 ? tag.length : close + 1;
  }
  if (first !== "{") return from;
  let depth = 0;
  let quote = "";
  for (let i = from; i < tag.length; i++) {
    const c = tag[i] as string;
    if (quote !== "") {
      if (c === "\\") i++;
      else if (c === quote) quote = "";
    } else if (c === '"' || c === "'" || c === "`") quote = c;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i + 1;
  }
  return tag.length;
}

/** Nested JSX inside a prop (`icon={<Icon className="size-4" />}`) is
 * blanked so its className is not read as the outer tag's. */
function maskNestedJsx(tag: string): string {
  let out = "";
  let i = 0;
  while (i < tag.length) {
    if (tag[i] !== "{") {
      out += tag[i];
      i++;
      continue;
    }
    const close = valueEnd(tag, i);
    const group = tag.slice(i, close);
    out += /<[A-Za-z>]/.test(group) ? group.replaceAll(/[^\n]/g, " ") : group;
    i = close;
  }
  return out;
}

function lineOfIndex(text: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) if (text[i] === "\n") line++;
  return line;
}

/** `hover:[&>svg]:ml-2` splits into its variants and the utility `ml-2`. */
function splitVariants(token: string): { variants: string[]; utility: string } {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    const c = token[i];
    if (c === "[") depth++;
    else if (c === "]") depth = Math.max(0, depth - 1);
    else if (c === ":" && depth === 0) {
      parts.push(token.slice(start, i));
      start = i + 1;
    }
  }
  return { variants: parts, utility: token.slice(start) };
}

function firstLayoutClass(
  value: string,
  pattern: RegExp,
): { index: number; text: string } | null {
  for (const m of value.matchAll(CLASS_TOKEN)) {
    const { utility } = splitVariants(m[0]);
    if (pattern.test(utility)) return { index: m.index, text: m[0] };
  }
  return null;
}

/**
 * A JSX opening tag whose className carries a layout utility (in a literal,
 * inside `cn()`, behind a variant) and declares no part: no attribute, no
 * `{...part(` spread, and not a primitive that emits its own. One finding
 * per tag, on the line of its first layout class. One line may carry the
 * marker with a reason (`// layout-ok <reason>`).
 */
export function findUndeclaredLayout(
  source: string,
  options: UndeclaredLayoutOptions = {},
): Finding[] {
  const attribute = options.attribute ?? "data-part";
  const primitives = options.primitives ?? new Set<string>();
  const pattern = options.pattern ?? LAYOUT_TOKEN;
  const declares = new RegExp(
    String.raw`\b${attribute.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)}\s*=|\{\s*\.\.\.part\(`,
  );
  const marker = new RegExp(String.raw`${options.marker ?? "layout-ok"}\s+\S`);
  const code = stripComments(source);
  const lines = source.split("\n");
  const found: Finding[] = [];
  for (const open of code.matchAll(JSX_OPEN)) {
    if (primitives.has(open[0].slice(1))) continue;
    const end = tagEnd(code, open.index + open[0].length);
    if (end < 0) continue;
    const tag = maskNestedJsx(code.slice(open.index, end));
    if (declares.test(tag)) continue;
    for (const attr of tag.matchAll(/\bclassName\s*=\s*/g)) {
      const from = attr.index + attr[0].length;
      const cls = firstLayoutClass(
        tag.slice(from, valueEnd(tag, from)),
        pattern,
      );
      if (cls === null) continue;
      const line = lineOfIndex(code, open.index + from + cls.index);
      if (marker.test(lines[line - 1] ?? "")) break;
      found.push({
        line,
        message: `${open[0]} … className="${cls.text}": layout with no part declared (add ${attribute} / {...part(…)} or use a primitive that declares one)`,
      });
      break;
    }
  }
  return found;
}
