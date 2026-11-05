// For the Storybook project's vitest config, node side:
//
//   import { partsUpdateDefine } from "<your copy>/storybook/define";
//   export default defineConfig({ define: partsUpdateDefine(), ... });
//
// PARTS_UPDATE=1 turns the rendered gate from "compare" into "record". The
// browser cannot read process.env, so it is baked in as a global the hook
// reads (globals.d.ts declares it).
export function partsUpdateDefine(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Record<string, string> {
  return { PARTS_UPDATE_MODE: JSON.stringify(env.PARTS_UPDATE === "1") };
}
