"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec_p_1 = require("@kwsites/exec-p");
const git_1 = require("./git");
const context_1 = require("./util/context");
function simpleGit(baseDir) {
    const context = new context_1.ContextModel({
        exec(commands) {
            return exec_p_1.execP(context.command, commands, {
                cwd: context.baseDir,
            });
        }
    });
    if (baseDir !== undefined) {
        context.baseDir = baseDir;
    }
    return new git_1.Git(context);
}
exports.simpleGit = simpleGit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDRDQUF3QztBQUV4QywrQkFBNEI7QUFFNUIsNENBQThDO0FBRTlDLFNBQWdCLFNBQVMsQ0FBRSxPQUFnQjtJQUV4QyxNQUFNLE9BQU8sR0FBWSxJQUFJLHNCQUFZLENBQUM7UUFDdkMsSUFBSSxDQUFFLFFBQWtCO1lBQ3JCLE9BQU8sY0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFO2dCQUNyQyxHQUFHLEVBQUUsT0FBTyxDQUFDLE9BQU87YUFDdEIsQ0FBQyxDQUFDO1FBQ04sQ0FBQztLQUNILENBQUMsQ0FBQztJQUVILElBQUksT0FBTyxLQUFLLFNBQVMsRUFBRztRQUN6QixPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztLQUM1QjtJQUVELE9BQU8sSUFBSSxTQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7QUFFM0IsQ0FBQztBQWhCRCw4QkFnQkMifQ==