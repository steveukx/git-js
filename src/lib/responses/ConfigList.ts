import { last, splitOn } from '../utils/util';

/**
 * Represents the map of configuration settings
 */
export interface ConfigValues {
   [key: string]: string | string[];
}

/**
 * Represents the current git configuration, as defined by the output from `git log`
 */
export interface ConfigListSummary {

   /**
    * All configuration settings, where local/user settings override user/global settings
    * the overridden value will appear in this object.
    */
   readonly all: ConfigValues;

   /**
    * The file paths configuration was read from
    */
   files: string[];

   /**
    * The `ConfigValues` for each of the `files`, use this object to determine
    * local repo, user and global settings.
    */
   values: {[fileName: string]: ConfigValues};
}

export class ConfigList implements ConfigListSummary {

   private _all: ConfigValues | undefined;

   public get all (): ConfigValues {
      if (!this._all) {
         this._all = Object.assign({},
            ...this.files.map(file => this.values[file])
         );
      }

      return this._all as ConfigValues;
   }

   public files: string[] = [];

   public values: {[fileName: string]: ConfigValues} = Object.create(null);

   public addFile (file: string): ConfigValues {
      if (!(file in this.values)) {
         const latest = last(this.files);
         this.values[file] = latest ? Object.create(this.values[latest]) : {}

         this.files.push(file);
      }

      return this.values[file];
   }

   public addValue (file: string, key: string, value: string) {
      const values = this.addFile(file);

      if (!values.hasOwnProperty(key)) {
         values[key] = value;
      }
      else if (Array.isArray(values[key])) {
         (values[key] as string[]).push(value);
      }
      else {
         values[key] = [values[key] as string, value];
      }

      this._all = undefined;
   }

}

export function configListParser (text: string): ConfigList {
   const config = new ConfigList();
   const lines = text.split('\0');

   for (let i = 0, max = lines.length - 1; i < max;) {
      const file = configFilePath(lines[i++]);
      const [key, value] = splitOn(lines[i++], '\n');

      config.addValue(file, key, value);
   }

   return config;
}

function configFilePath (filePath: string): string {
   return filePath.replace(/^(file):/, '');
}
