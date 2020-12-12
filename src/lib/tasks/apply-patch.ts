import { straightThroughStringTask } from "./task";
import { StringTask } from "../types";

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
