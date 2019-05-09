"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function deferred() {
    let resolve, reject;
    const promise = new Promise((ok, fail) => {
        resolve = ok;
        reject = fail;
    });
    return {
        promise,
        resolve: (arg) => resolve(arg),
        reject: (arg) => reject(arg),
    };
}
exports.deferred = deferred;
//# sourceMappingURL=deferred.js.map