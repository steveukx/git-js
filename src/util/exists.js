"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
function checkFS(path, isFile, isDirectory) {
    try {
        let matches = false;
        const stat = fs.statSync(path);
        matches = matches || isFile && stat.isFile();
        matches = matches || isDirectory && stat.isDirectory();
        return matches;
    }
    catch (e) {
        if (e.code === 'ENOENT') {
            return false;
        }
        throw e;
    }
}
function exists(path, type) {
    if (!type) {
        return checkFS(path, true, true);
    }
    return checkFS(path, !!(type & exports.FILE), !!(type & exports.FOLDER));
}
exports.exists = exists;
exports.FILE = 1;
exports.FOLDER = 2;
//# sourceMappingURL=exists.js.map