import { straightThroughStringTask } from "./task";
import { OptionFlags, Options, StringTask } from "../types";

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

export function applyTask(
   patch: string | string[] | undefined,
   customArgs: string[]
): StringTask<string> {
   const commands = ["apply", ...customArgs];

   if (typeof patch === "string") {
      commands.push(patch);
   } else if (Array.isArray(patch)) {
      commands.push(...patch);
   }

   return straightThroughStringTask(commands);
}
