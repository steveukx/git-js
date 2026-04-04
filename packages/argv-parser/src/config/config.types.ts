export interface ConfigOperation {
   isWrite: boolean;
   isRead: boolean;
   key: string;
   value?: string;
}
