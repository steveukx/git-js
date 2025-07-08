module.exports.logger = (name) => {
   return (...args) => {
      console.log(`${name}:`, ...args);
   };
};
