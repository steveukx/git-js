import {
   GitConstructError,
   GitError,
   GitPluginError,
   GitResponseError,
   TaskConfigurationError,
} from '../../src/errors';
import { createInstanceConfig } from '../../src/options';
import {
   adhocExecTask,
   configurationErrorTask,
   isBufferTask,
   isEmptyTask,
   straightThroughBufferTask,
   straightThroughStringTask,
} from '../../src/tasks';
import {
   asArray,
   asFunction,
   asStringArray,
   bufferToString,
   delay,
   ExitCodes,
   folderExists,
   GitOutputStreams,
   isUserFunction,
   LineParser,
   NOOP,
   parseStringResponse,
   pick,
   prefixedArray,
   RemoteLineParser,
   remove,
   splitOn,
} from '../../src/utils';
import { isInvalidDirectory, isValidDirectory } from '../__fixtures__';

describe('errors', () => {
   it('all derive from GitError with message and prototype chain intact', () => {
      const construct = new GitConstructError(createInstanceConfig(), 'construct');
      const plugin = new GitPluginError(undefined, 'timeout', 'plugin');
      const response = new GitResponseError({ parsed: true }, 'response');
      const task = new TaskConfigurationError('task');

      for (const error of [construct, plugin, response, task]) {
         expect(error).toBeInstanceOf(GitError);
         expect(error).toBeInstanceOf(Error);
      }

      expect(construct.message).toBe('construct');
      expect(construct.config).toEqual(createInstanceConfig());
      expect(plugin.plugin).toBe('timeout');
      expect(response.git).toEqual({ parsed: true });
      expect(task.message).toBe('task');
   });

   it('GitResponseError uses the git response as the default message', () => {
      expect(new GitResponseError('git-detail').message).toBe('git-detail');
      expect(new GitResponseError('git-detail', 'custom').message).toBe('custom');
   });
});

describe('task primitives', () => {
   it('straightThroughStringTask passes text through, optionally trimmed', () => {
      const plain = straightThroughStringTask(['status']);
      expect(plain.format).toBe('utf-8');
      expect(plain.commands).toEqual(['status']);
      expect(plain.parser(' output ', '')).toBe(' output ');

      expect(straightThroughStringTask(['status'], true).parser(' output ', '')).toBe('output');
   });

   it('straightThroughBufferTask passes the buffer through', () => {
      const task = straightThroughBufferTask(['cat-file']);
      const buffer = Buffer.from('binary');

      expect(task.format).toBe('buffer');
      expect(task.parser(buffer, Buffer.of())).toBe(buffer);
   });

   it('configurationErrorTask throws its error from the parser', () => {
      expect(() => configurationErrorTask('bad config').parser(null as any)).toThrow(
         TaskConfigurationError
      );

      const custom = new Error('custom');
      expect(() => configurationErrorTask(custom).parser(null as any)).toThrow(custom);
   });

   it('adhocExecTask runs as an empty task', () => {
      const task = adhocExecTask(NOOP);
      expect(task.commands).toHaveLength(0);
      expect(isEmptyTask(task)).toBe(true);
      expect(isBufferTask(task)).toBe(false);
   });

   it('detects buffer and empty formats', () => {
      expect(isBufferTask(straightThroughBufferTask(['x']))).toBe(true);
      expect(isBufferTask(straightThroughStringTask(['x']))).toBe(false);
      expect(isEmptyTask(straightThroughStringTask([]))).toBe(true);
      expect(isEmptyTask(straightThroughStringTask(['x']))).toBe(false);
   });
});

describe('createInstanceConfig', () => {
   it('applies defaults including the deny-by-default allow-lists', () => {
      const config = createInstanceConfig();

      expect(config).toEqual(
         expect.objectContaining({
            baseDir: process.cwd(),
            binary: 'git',
            maxConcurrentProcesses: 5,
            config: [],
            trimmed: false,
            allowEnvironment: [],
            allowConfigWrite: [],
         })
      );
   });

   it('merges partial options over defaults, later options win', () => {
      const config = createInstanceConfig(
         { baseDir: '/foo', trimmed: true },
         undefined,
         { allowConfigWrite: ['user.name'] },
         { baseDir: '/bar' }
      );

      expect(config.baseDir).toBe('/bar');
      expect(config.trimmed).toBe(true);
      expect(config.allowConfigWrite).toEqual(['user.name']);
      expect(config.maxConcurrentProcesses).toBe(5);
   });

   it('restores a missing baseDir and normalises trimmed', () => {
      const config = createInstanceConfig({ baseDir: '', trimmed: 1 as any });

      expect(config.baseDir).toBe(process.cwd());
      expect(config.trimmed).toBe(false);
   });
});

describe('output streams', () => {
   it('converts buffers to utf-8 strings', () => {
      const streams = new GitOutputStreams(Buffer.from('std-out'), Buffer.from('std-err'));
      const strings = streams.asStrings();

      expect(strings.stdOut).toBe('std-out');
      expect(strings.stdErr).toBe('std-err');
   });
});

describe('line parsing', () => {
   it('parses matching lines into the target', () => {
      const target: { names: string[] } = { names: [] };
      const parser = new LineParser<typeof target>(/^name: (.+)$/, (result, [name]) => {
         result.names.push(name);
      });

      parseStringResponse(target, [parser], 'name: abc\nskipped\nname: def');

      expect(target.names).toEqual(['abc', 'def']);
   });

   it('throws when useMatches is not implemented', () => {
      const parser = new LineParser<{}>(/(.+)/);
      expect(() => parseStringResponse({}, [parser], 'anything')).toThrow(
         'LineParser:useMatches not implemented'
      );
   });

   it('RemoteLineParser only matches remote-prefixed lines', () => {
      const target: { lines: string[] } = { lines: [] };
      const parser = new RemoteLineParser<typeof target>(/remote:\s+(.+)/, (result, [line]) => {
         result.lines.push(line);
      });

      parseStringResponse(target, [parser], 'remote: from-remote\nnot remote content');

      expect(target.lines).toEqual(['from-remote']);
   });

   it('supports multi-line matchers via line offsets', () => {
      const target: { pairs: Array<[string, string]> } = { pairs: [] };
      const parser = new LineParser<typeof target>(
         [/^first: (.+)$/, /^second: (.+)$/],
         (result, [first, second]) => {
            result.pairs.push([first, second]);
         }
      );

      parseStringResponse(target, [parser], 'first: a\nsecond: b');

      expect(target.pairs).toEqual([['a', 'b']]);
   });
});

describe('util helpers', () => {
   it('splitOn splits at the first occurrence only', () => {
      expect(splitOn('key=value=more', '=')).toEqual(['key', 'value=more']);
      expect(splitOn('no-separator', '=')).toEqual(['no-separator', '']);
   });

   it('asFunction and isUserFunction distinguish NOOP', () => {
      const fn = () => 'real';
      expect(asFunction(fn)).toBe(fn);
      expect(asFunction('not a function')).toBe(NOOP);
      expect(isUserFunction(fn)).toBe(true);
      expect(isUserFunction(NOOP)).toBe(false);
      expect(isUserFunction('nope')).toBe(false);
   });

   it('remove takes items out of arrays and sets', () => {
      const array = ['a', 'b'];
      expect(remove(array, 'a')).toBe('a');
      expect(array).toEqual(['b']);
      expect(remove(array, 'missing')).toBe('missing');

      const set = new Set(['a', 'b']);
      remove(set, 'b');
      expect(Array.from(set)).toEqual(['a']);
   });

   it('array and string coercion helpers', () => {
      expect(asArray('one')).toEqual(['one']);
      expect(asArray(['one'])).toEqual(['one']);
      expect(asStringArray([1, 'two'])).toEqual(['1', 'two']);
      const boxed = new String('three');
      expect(asStringArray([boxed])[0]).toBe(boxed);
      expect(prefixedArray(['a', 'b'], '-c')).toEqual(['-c', 'a', '-c', 'b']);
      expect(bufferToString(Buffer.from('abc'))).toBe('abc');
      expect(bufferToString([Buffer.from('ab'), Buffer.from('c')])).toBe('abc');
   });

   it('pick copies only defined listed properties', () => {
      expect(pick({ uid: 1, gid: undefined, other: 3 }, ['uid', 'gid'])).toEqual({ uid: 1 });
   });

   it('folderExists delegates to the file-exists check', () => {
      isValidDirectory();
      expect(folderExists(__dirname)).toBe(true);
      isInvalidDirectory();
      expect(folderExists(`${__dirname}/does-not-exist`)).toBe(false);
      isValidDirectory();
   });

   it('delay resolves asynchronously', async () => {
      await expect(delay()).resolves.toBeUndefined();
   });

   it('exposes the known git exit codes', () => {
      expect(ExitCodes.SUCCESS).toBe(0);
      expect(ExitCodes.ERROR).toBe(1);
      expect(ExitCodes.NOT_FOUND).toBe(-2);
      expect(ExitCodes.UNCLEAN).toBe(128);
   });
});
