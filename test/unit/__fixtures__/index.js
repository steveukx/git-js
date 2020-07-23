
module.exports = ['push'].reduce((all, dir) => {
   Object.assign(all.constants, require(`./${dir}/constants`));
   all[dir] = require(`./${dir}`);

   return all;
}, { constants: {} });

