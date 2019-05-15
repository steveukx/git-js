import { Context } from '../interfaces/context';

function validContextOption (context: ContextModel, key: string, value: any) {
   if (value === undefined) {
      return false;
   }

   if (context.hasOwnProperty(key) || Object.getPrototypeOf(context).hasOwnProperty(key)) {
      return key !== 'constructor';
   }
}

export class ContextModel implements Context {

   public baseDir: string = process.cwd();

   public command = 'git';

   public env = null;

   public exec() {
      return Promise.reject(new Error('ContextModel requires an executor'));
   }

   constructor(options?: any) {
      if (options) {
         for (let keys = Object.keys(options), i = 0, max = keys.length; i < max; i++) {
            const key = keys[i];
            const value = options[key];

            if (validContextOption(this, key, value)) {
               (this as any)[key] = value;
            }
         }
      }
   }

}
