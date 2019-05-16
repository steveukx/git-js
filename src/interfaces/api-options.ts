
export type  ApiOptionsArray = string[];

export interface ApiOptionsObject {
   [key: string]: string | null;
}

export type ApiOptions = ApiOptionsArray | ApiOptionsObject;
