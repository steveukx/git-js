
module.exports = (function mockFileExistsModule () {
   let next = true;

   return {
      $fails () {
         next = false;
      },
      $reset () {
         next = true;
      },
      exists () {
         return next;
      },
      FOLDER: 2,
   };
}());



