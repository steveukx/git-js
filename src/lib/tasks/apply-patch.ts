import { straightThroughStringTask } from "./task";
import { Options, OptionFlags, StringTask } from "../types";

export type ApplyOptions = Options &
   OptionFlags<
      | "--stat"
      | "--numstat"
      | "--summary"
      | "--check"
      | "--index"
      | "--intent-to-add"
      | "--3way"
      | "--apply"
      | "--no-add"
      | "-R"
      | "--reverse"
      | "--allow-binary-replacement"
      | "--binary"
      | "--reject"
      | "-z"
      | "--inaccurate-eof"
      | "--recount"
      | "--cached"
      | "--ignore-space-change"
      | "--ignore-whitespace"
      | "--verbose"
      | "--unsafe-paths"
   > &
   OptionFlags<
      "--whitespace",
      "nowarn" | "warn" | "fix" | "error" | "error-all"
   > &
   OptionFlags<
      "--build-fake-ancestor" | "--exclude" | "--include" | "--directory",
      string
   > &
   OptionFlags<"-p" | "-C", number>;

export function applyPatchTask(
   patches: string | string[],
   customArgs: string[]
): StringTask<string> {
   const commands = ["apply", ...customArgs];

   if (typeof patches === "string") {
      commands.push(patches);
   } else if (Array.isArray(patches)) {
      commands.push(...patches);
   }

   return straightThroughStringTask(commands);
}
