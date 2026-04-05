import { parseArgv } from '@simple-git/argv-parser';
import { describe, expect, it } from 'vitest';

import { aParsedFlag } from './__fixtures__/mocks';

describe('parse-flags', () => {
   describe('short flags', () => {
      it('parses a bare flag', () => {
         expect(parseArgv('add', '-A').flags).toEqual([aParsedFlag('-A')]);
      });

      it('parses a switch that consumes the next token', () => {
         expect(parseArgv('commit', '-m', 'the message').flags).toEqual([
            aParsedFlag('-m', 'the message'),
         ]);
      });

      it('expands a known cluster into individual entries', () => {
         // clone -u and -c are both value-consumers
         const { flags } = parseArgv(
            'clone',
            '-uc',
            'git-upload-pack',
            'core.sshCommand=CMD',
            'git@github.com:x/y.git'
         );
         expect(flags).toEqual([
            aParsedFlag('-u', 'git-upload-pack'),
            aParsedFlag('-c', 'core.sshCommand=CMD'),
         ]);
      });

      it('keeps an unknown cluster as one opaque switch', () => {
         // -x is not in clone's known short switches
         const { flags } = parseArgv('clone', '-xu', 'git@github.com:x/y.git');
         expect(flags).toEqual([aParsedFlag('-xu')]);
      });

      it('embeds the remainder as a value when a consumer precedes unknown chars', () => {
         // commit -mFix: -m is a consumer, 'Fix' is not a cluster of known flags
         expect(parseArgv('commit', '-mFix').flags).toContainEqual(aParsedFlag('-m', 'Fix'));
      });

      it('does not collapse separate short switches', () => {
         const { flags } = parseArgv('commit', '-m', 'msg', '-C', 'HEAD');
         expect(flags).toContainEqual(aParsedFlag('-m', 'msg'));
         expect(flags).toContainEqual(aParsedFlag('-C', 'HEAD'));
      });
   });

   describe('long flags', () => {
      it('parses a bare flag', () => {
         expect(parseArgv('commit', '--amend').flags).toEqual([aParsedFlag('--amend')]);
      });

      it('parses a negated flag', () => {
         expect(parseArgv('push', '--no-verify').flags).toEqual([aParsedFlag('--no-verify')]);
         expect(parseArgv('status', '--no-short').flags).toEqual([aParsedFlag('--no-short')]);
      });

      it('parses a value embedded with =', () => {
         expect(parseArgv('push', '--exec=custom-pack').flags).toContainEqual(
            aParsedFlag('--exec', 'custom-pack')
         );
      });

      it('parses a value from the next token', () => {
         expect(parseArgv('commit', '--message', 'the fix').flags).toContainEqual(
            aParsedFlag('--message', 'the fix')
         );
      });

      it('handles = in the value', () => {
         expect(parseArgv('push', '--receive-pack=ssh -i key').flags).toContainEqual(
            aParsedFlag('--receive-pack', 'ssh -i key')
         );
      });
   });

   describe('global flags', () => {
      it('are included in the switches list', () => {
         const { flags } = parseArgv('-v', 'status');
         expect(flags).toContainEqual(aParsedFlag('-v'));
      });

      it('-c is included alongside command switches', () => {
         const { flags } = parseArgv('-c', 'core.fsmonitor=false', 'status');
         expect(flags).toContainEqual(aParsedFlag('-c', 'core.fsmonitor=false'));
      });

      it('--config-env is included with its value', () => {
         const { flags } = parseArgv('--config-env=core.sshCommand=GIT_SSH_COMMAND', 'fetch');
         expect(flags).toContainEqual(
            aParsedFlag('--config-env', 'core.sshCommand=GIT_SSH_COMMAND')
         );
      });

      it('mixes with command switches', () => {
         const { flags } = parseArgv('-v', 'commit', '--amend');
         expect(flags).toContainEqual(aParsedFlag('-v'));
         expect(flags).toContainEqual(aParsedFlag('--amend'));
      });
   });
});
