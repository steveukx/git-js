import { prefixedArray } from '../../utils';
import type { PipelineStep } from '../types';

export function commandConfigPrefixingStep(configuration: string[]): PipelineStep {
   const prefix = prefixedArray(configuration, '-c');

   return {
      name: 'commandConfigPrefixing',
      args(args) {
         return [...prefix, ...args];
      },
   };
}
