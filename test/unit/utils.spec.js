import { restore } from './include/setup';
import { createLogger } from "../../src/lib/git-logger";
import {
   filterArray,
   filterFunction,
   filterHasLength,
   filterPlainObject,
   filterPrimitives,
   NOOP
} from "../../src/lib/utils";

describe('utils', () => {

   describe('createLogger', () => {

      let logger;
      const debug = require('debug');
      const { enable, $setup, $logged } = debug;
      beforeEach(() => $setup('*'));
      afterEach(() => restore());

      it('logger created without a verbose namespace logs verbose and info to the same log', () => {
         const logger = createLogger('FOO');
         expect(typeof logger).toBe('function');
         expect(typeof logger.info).toBe('function');

         logger('logged to verbose');
         logger.info('logged to info');
         expect($logged()).toEqual({
            'simple-git': expect.objectContaining({ count: 2 }),
         });
      });

      describe('with a custom verbose logger', () => {
         beforeEach(() => {
            logger = createLogger('BAR', debug('verbose'));
         });

         it('logs verbose only to the custom verbose log without prefixing', () => {
            logger('logged to verbose');
            expect($logged()).toEqual({
               'verbose': expect.objectContaining({ merged: ['logged to verbose'] }),
            });
         });

         it('logs to info with prefix and verbose without prefix', () => {
            logger('logged to verbose');
            logger.info('logged to info');

            expect($logged()).toEqual({
               'verbose': expect.objectContaining({ merged: ['logged to verbose', 'logged to info'] }),
               'simple-git': expect.objectContaining({ merged: ['[BAR]  logged to info'] }),
            });
         });
      })



      it('creates a custom logger', () => {
         const logger = createLogger('FOO', 'BAR');
         expect(typeof logger).toBe('function');
         expect(typeof logger.info).toBe('function');

         expect(logger.namespace).toBe('simple-git:BAR');
      });

      it('logs info messages to both the info and verbose logs', () => {
         createLogger('FOO', 'BAR').info('A');

         expect($logged()).toEqual({
            'simple-git:BAR': expect.objectContaining({ messages: ['A'] }),
            'simple-git': expect.objectContaining({ messages: ['%s A'] }),
         });
      });

      it('logs verbose messages to only the verbose log', () => {
         createLogger('FOO', 'BAR')('A');

         expect($logged()).toEqual({
            'simple-git:BAR': expect.objectContaining({ messages: ['A'] }),
         });
      });

      it('writes buffer contents into the log', () => {
         createLogger('FOO', 'BAR')('Content: %B', Buffer.from('HELLO', "ascii"));
         expect($logged()).toEqual({
            'simple-git:BAR': expect.objectContaining({ messages: ['Content: HELLO'] }),
         });
      });

      it('writes type of content to the log when unpacking a non-buffer with the %B format', () => {
         createLogger('FOO', 'BAR')('Content: %B', 'not-a-buffer');
         expect($logged()).toEqual({
            'simple-git:BAR': expect.objectContaining({ messages: ['Content: [object String]'] }),
         });
      });

   });

   describe('argument filtering', () => {

      it('recognises arrays', () => {
         expect(filterArray([])).toBe(true);
         expect(filterArray({})).toBe(false);
         expect(filterArray(undefined)).toBe(false);
      });

      it('recognises primitives', () => {
         expect(filterPrimitives([])).toBe(false);
         expect(filterPrimitives({})).toBe(false);
         expect(filterPrimitives(undefined)).toBe(false);

         expect(filterPrimitives(123.456)).toBe(true);
         expect(filterPrimitives('hello world')).toBe(true);
         expect(filterPrimitives(false)).toBe(true);
         expect(filterPrimitives(true)).toBe(true);
      });

      it('recognises plain objects', () => {
         expect(filterPlainObject({})).toBe(true);
         expect(filterPlainObject(Object.create(null))).toBe(true);

         expect(filterPlainObject(NOOP)).toBe(false);
      });

      it('recognises functions', () => {
         expect(filterFunction(NOOP)).toBe(true);
         expect(filterFunction(() => {})).toBe(true);

         expect(filterFunction({})).toBe(false);
      });

      it('recognises entities with a length', () => {
         expect(filterHasLength([])).toBe(true);
         expect(filterHasLength('')).toBe(true);
         expect(filterHasLength({length: 1})).toBe(true);
         expect(filterHasLength(Buffer.from('hello', 'utf8'))).toBe(true);

         expect(filterHasLength({})).toBe(false);
         expect(filterHasLength({length: false})).toBe(false);
         expect(filterHasLength(1)).toBe(false);
         expect(filterHasLength(true)).toBe(false);
         expect(filterHasLength(undefined)).toBe(false);
         expect(filterHasLength(null)).toBe(false);
         expect(filterHasLength(NOOP)).toBe(false);
      });

   });
});
