import {find, remove} from 'lodash';
import {Injectable} from '@angular/core';
import {IMessage} from './IMessage';
import {MessageChannel} from './MessageChannel';
import {MESSAGE_TYPE_LOG_SERVICE} from '../constants';
import {LogMessage} from './types/LogMessage';


@Injectable()
export class MessageService {

  channels: MessageChannel<IMessage>[] = [];


  getLogService(): MessageChannel<LogMessage> {
    return <MessageChannel<LogMessage>>this.get(MESSAGE_TYPE_LOG_SERVICE);
  }

  open<T extends IMessage>(channelName: string) {
    const channel = new MessageChannel<T>(channelName);
    this.channels.push(channel);
    return channel;
  }


  get<T extends IMessage>(channelName: string) {
    const found = find(this.channels, c => c.getName() === channelName);
    if (found) {
      return found;
    }
    return this.open(channelName);
  }

  close(channelName: string) {
    return remove(this.channels, c => c.getName() === channelName).map(e => {
      e.finish();
      return e;
    });
  }

}
