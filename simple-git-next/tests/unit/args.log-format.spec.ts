import { LogFormat, logFormatFromCommand } from '../../src/lib/args/log-format';

describe('log-format', function () {
   it.each<[LogFormat, string[]]>([
      [LogFormat.NONE, []],
      [LogFormat.NONE, ['foo', 'bar', '--nothing']],
      [LogFormat.STAT, ['foo', '--stat', 'bar']],
      [LogFormat.STAT, ['foo', '--stat=4096', '--bar']],
      [LogFormat.NUM_STAT, ['foo', '--numstat', '--bar']],
      [LogFormat.NAME_ONLY, ['--name-only', 'foo', '--bar']],
      [LogFormat.NAME_STATUS, ['--name-status']],
   ])('Picks %s from %s', (format, args) => {
      expect(logFormatFromCommand(args)).toBe(format);
   });

   it('picks the first format', () => {
      expect(logFormatFromCommand(['--stat', '--numstat'])).toBe(LogFormat.STAT);
      expect(logFormatFromCommand(['--numstat', '--stat'])).toBe(LogFormat.NUM_STAT);
   });
});
