/** Represents the response to using `git.getConfig` */
export interface ConfigGetResult {
   /** The key that was searched for */
   key: string;

   /** The single value seen by `git` for this key (equivalent to `git config --get key`) */
   value: string | null;

   /** All possible values for this key no matter the scope (equivalent to `git config --get-all key`) */
   values: string[];

   /** The file paths from which configuration was read */
   paths: string[];

   /**
    * The full hierarchy of values the property can have had across the
    * various scopes that were searched (keys in this Map are the strings
    * also found in the `paths` array).
    */
   scopes: Map<string, string[]>;
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
   values: { [fileName: string]: ConfigValues };
}

/**
 * Represents the map of configuration settings
 */
export interface ConfigValues {
   [key: string]: string | string[];
}

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
         this.values[file] = latest ? Object.create(this.values[latest]) : {};

         this.files.push(file);
      }

      return this.values[file];
   }

   public addValue(file: string, key: string, value: string): void {
      const values = this.addFile(file);

      if (!Object.hasOwn(values, key)) {
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

   for (const item of configParser(text)) {
      config.addValue(item.file, String(item.key), item.value);
   }

   return config;
}

export function configGetParser(text: string, key: string): ConfigGetResult {
   let value: string | null = null;
   const values: string[] = [];
   const scopes: Map<string, string[]> = new Map();

   for (const item of configParser(text, key)) {
      if (item.key !== key) {
         continue;
      }

      values.push((value = item.value));

      if (!scopes.has(item.file)) {
         scopes.set(item.file, []);
      }

      scopes.get(item.file)!.push(value);
   }

   return {
      key,
      paths: Array.from(scopes.keys()),
      scopes,
      value,
      values,
   };
}

function configFilePath(filePath: string): string {
   return filePath.replace(/^(file):/, '');
}

function* configParser(text: string, requestedKey: string | null = null) {
   const lines = text.split('\0');

   for (let i = 0, max = lines.length - 1; i < max; ) {
      const file = configFilePath(lines[i++]);

      let value = lines[i++];
      let key = requestedKey;

      if (value.includes('\n')) {
         const line = splitOn(value, '\n');
         key = line[0];
         value = line[1];
      }

      yield { file, key, value };
   }
}
