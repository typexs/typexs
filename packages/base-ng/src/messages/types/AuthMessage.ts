import {IMessage, MessageType} from '../../messages/IMessage';

export class AuthMessage implements IMessage {
  content: any;
  topic: any;
  type: MessageType;
}
