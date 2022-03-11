module.exports.logger = (name) =>
   (...args) => console.log(`${name}:`, ...args);
