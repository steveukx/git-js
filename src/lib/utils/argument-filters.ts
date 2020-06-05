export interface ArgumentFilterPredicate {
   (input: any): boolean;
}

export function filterType<T>(input: T | any, ...filters: ArgumentFilterPredicate[]): T | undefined {
   return filters.some((filter) => filter(input)) ? input : undefined;
}

export const filterArray: ArgumentFilterPredicate = (input): input is Array<any> => {
   return Array.isArray(input);
}

export const filterPrimitives: ArgumentFilterPredicate = (input): input is string | number | boolean => {
   return /number|string|boolean/.test(typeof input);
}

export const filterString: ArgumentFilterPredicate = (input): input is string => {
   return typeof input === 'string';
};

export const filterPlainObject: ArgumentFilterPredicate = (input): input is Object => {
   return !!input && Object.prototype.toString.call(input) === '[object Object]';
}
