export interface IMessage {
  topic?: string;
  type?: string;
  content?: string;
  args?: any[];
  time?: Date;

  [k: string]: any;
}
