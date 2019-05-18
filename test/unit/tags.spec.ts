import expect from 'expect.js';
import { TagListResponse } from '../../src/responses';
import { addAnnotatedTag, addTag, tag, tags } from '../../src/api';
import { mockContextWithResponse } from './include/mock.context';

describe('tags', () => {

   let context: any;

   afterEach(() => context = undefined);

   it('with a character prefix', () => {
      const tagList = TagListResponse.parse(`
 v1.0.0 
 v0.0.1 
 v0.6.2`, false);

      expect(tagList.latest).to.be('v1.0.0');
      expect(tagList.all).to.eql(['v0.0.1', 'v0.6.2', 'v1.0.0']);
   });


   it('with a character prefix and different lengths', () => {
      const tagList = TagListResponse.parse(`
 v1.0 
 v1.0.1`, false);

      expect(tagList.latest).to.be('v1.0.1');
      expect(tagList.all).to.eql(['v1.0', 'v1.0.1']);
   });

   it('with max count shorthand property', async () => {
      context = mockContextWithResponse(`
         0.1.1
         1.2.1
         1.1.1
        `);

      const response = await tags(context, []);

      expect(context.exec.calledWith(['tag', '-l']));
      expect(response.latest).to.be('1.2.1');
      expect(response.all).to.eql(['0.1.1', '1.1.1', '1.2.1']);
   });

   it('removes empty lines', async () => {
      context = mockContextWithResponse(`

    0.1.0

    0.10.0

    0.10.1

    0.2.0

    1.10.0

    tagged
        `);

      const response = await tags(context, []);

      expect(context.exec.calledWith(['tag', '-l']));
      expect(response.latest).to.be('1.10.0');
      expect(response.all).to.eql(['0.1.0', '0.2.0', '0.10.0', '0.10.1', '1.10.0', 'tagged']);
   });

   it( 'respects a custom sort order', async () => {
      context = mockContextWithResponse(`
    aaa
    0.10.0
    0.2.0
    bbb
`);

      const response = await tags(context, {'--sort': 'foo'});

      expect(context.exec.calledWith(['tag', '-l', '--sort=foo']));
      expect(response.latest).to.be('aaa');
      expect(response.all).to.eql(['aaa', '0.10.0', '0.2.0', 'bbb']);

   });

   describe('tag', () => {

      beforeEach(() => context = mockContextWithResponse('...'));

      it('passes options object through to the command', async () => {
         await tag(context, {'--foo': null, 'bar': 'baz'});

         expect(context.exec.calledWith(['tag', '--foo', 'bar=baz']));
      });

      it('passes options array through to the command', async () => {
         await tag(context, ['bar=baz', '--foo']);

         expect(context.exec.calledWith(['tag', 'bar=baz', '--foo']));
      });

   });

   describe('addTag', () => {

      beforeEach(() => context = mockContextWithResponse('...'));

      it('passes name through to the command', async () => {
         await addTag(context, 'tag-name');

         expect(context.exec.calledWith(['tag', 'tag-name']));
      });

   });

   describe('addAnnotatedTag', () => {

      beforeEach(() => context = mockContextWithResponse('...'));

      it('passes name through to the command', async () => {
         await addAnnotatedTag(context, 'tag-name', 'message content');

         expect(context.exec.calledWith([
            'tag', '-a', '-m', 'tag-message', 'message content']));
      });

   });

});
