import { ConfigListSummary, ConfigValues } from '../../../typings';
import { last, splitOn } from '../utils';

export class ConfigList implements ConfigListSummary {

   public files: string[] = [];
   public values: { [fileName: string]: ConfigValues } = Object.create(null);

   private _all: ConfigValues | undefined;

   public get all(): ConfigValues {
      if (!this._all) {
         this._all = this.files.reduce((all: ConfigValues, file: string) => {
            return Object.assign(all, this.values[file]);
         }, {});
      }

      return this._all;
   }

   public addFile(file: string): ConfigValues {
      if (!(file in this.values)) {
         const latest = last(this.files);
         this.values[file] = latest ? Object.create(this.values[latest]) : {}

         this.files.push(file);
      }

      return this.values[file];
   }

   public addValue(file: string, key: string, value: string) {
      const values = this.addFile(file);

      if (!values.hasOwnProperty(key)) {
         values[key] = value;
      } else if (Array.isArray(values[key])) {
         (values[key] as string[]).push(value);
      } else {
         values[key] = [values[key] as string, value];
      }

      this._all = undefined;
   }

}

export function configListParser(text: string): ConfigList {
   const config = new ConfigList();
   const lines = text.split('\0');

   for (let i = 0, max = lines.length - 1; i < max;) {
      const file = configFilePath(lines[i++]);
      const [key, value] = splitOn(lines[i++], '\n');

      config.addValue(file, key, value);
   }

   return config;
}

function configFilePath(filePath: string): string {
   return filePath.replace(/^(file):/, '');
}
