
module.exports = ['push', 'remote-messages'].reduce((all, dir) => {
   Object.assign(all.constants, require(`./${dir}/constants`));
   all[dir.replace(/-(.)/g, ([_all, chr]) => String(chr).toUpperCase())] = require(`./${dir}`);

   return all;
}, { constants: {} });

