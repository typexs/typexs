export enum MessageType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO',
  WARNING  = 'WARNING'
}


export interface IMessage {

  type: MessageType;

  topic?: any;

  content: any;
}
