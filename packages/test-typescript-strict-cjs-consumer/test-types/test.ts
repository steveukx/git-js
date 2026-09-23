import { tests as irTypes } from './import-require.types';
import { tests as isTypes } from './import-star.types';
import { tests as niTypes } from './named-imports.types';

const all = {
   'import x = require()': irTypes,
   'import * as x from': isTypes,
   'import {x} from': niTypes,
};

(async () => {
   for (const [name, tests] of Object.entries(all)) {
      console.log(name);
      await suite(...tests);
   }
})();

async function suite(...tests: Array<() => Promise<void>>) {
   await tests.reduce((chain, test) => {
      return chain.then(() => {
         console.log(`Running ${test.name}`);
         test();
      });
   }, Promise.resolve());
   console.log(`Tests complete`);
}
