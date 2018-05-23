
var _Promise = typeof Promise === 'undefined' ? require('es6-promise').Promise : Promise;

module.exports = function deferred () {
   var d = {};
   d.promise = new _Promise(function (resolve, reject) {
      d.resolve = resolve;
      d.reject = reject;
   });

   return d;
};
