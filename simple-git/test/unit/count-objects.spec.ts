import { closeWithSuccess, like, newSimpleGit } from './__fixtures__';
import { CountObjectsResult } from '../../typings';

const COUNT_OBJ_RESPONSE = `
count: 323
size: 7920
in-pack: 8134
packs: 1
size-pack: 3916
prune-packable: 0
garbage: 0
size-garbage: 0
`;

describe('count-objects', () => {
   it('gets the repo object counts', async () => {
      const task = newSimpleGit().countObjects();
      await closeWithSuccess(COUNT_OBJ_RESPONSE);
      const objects = await task;

      expect(objects).toEqual(
         like({
            count: 323,
            size: 7920,
            inPack: 8134,
            packs: 1,
            sizePack: 3916,
         })
      );
   });

   it('ignores unknown properties', async () => {
      const task = newSimpleGit().countObjects();
      await closeWithSuccess('foo: 123');
      expect(await task).not.toHaveProperty('foo');
   });

   it('ignores invalid values', async () => {
      const task = newSimpleGit().countObjects();
      await closeWithSuccess('packs: error');
      expect(await task).toHaveProperty('packs', 0);
   });

   it.each<[string, keyof CountObjectsResult, number]>([
      ['prune-packable', 'prunePackable', 100],
      ['garbage', 'garbage', 101],
      ['size-garbage', 'sizeGarbage', 102],
   ])('parses %s property', async (key, asKey, value) => {
      const task = newSimpleGit().countObjects();
      await closeWithSuccess(`${key}: ${value}`);

      expect(await task).toEqual(like({ [asKey]: value }));
   });
});
