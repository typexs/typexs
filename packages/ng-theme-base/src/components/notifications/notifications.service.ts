import {assign, isArray} from 'lodash';
import {EventEmitter, Injectable} from '@angular/core';
import {IMessage} from '@typexs/base-ng';
import {NotifyItem} from './NotifyItem';


@Injectable()
export class NotificationsService {

  displayTime = 3000;

  OnAddMessage: EventEmitter<any> = new EventEmitter();
  OnRemoveMessage: EventEmitter<any> = new EventEmitter();

  static _createMessage(msg: IMessage | string): IMessage {
    return typeof msg === 'string' ? {content: msg, type: null, topic: null} : msg;
  }


  private message(msg: IMessage | string, displayTime: number = null) {
    msg = NotificationsService._createMessage(msg);

    // need id to know that the right one is being removed
    const message = new NotifyItem();
    assign(message, {
      heading: msg.topic,
      message: msg.content,
      type: msg.type,
      id: Math.floor((Math.random() * 999999999999) + 1),
      time: displayTime ? displayTime : this.displayTime
    });

    this.OnAddMessage.emit(message);
    if (message.time > 0) {
      setTimeout(() => {
        this.OnRemoveMessage.emit(message);
      }, message.time);
    } else {
      // 10h limit
      setTimeout(() => {
        this.OnRemoveMessage.emit(message);
      }, 36000000);
    }
  }

  addMessage(msg: IMessage, displayTime: number = null) {
    if (!msg) {
      return;
    }
    const arrayMsg: IMessage[] | string[] = isArray(msg) ? msg : [msg];
    for (const item of arrayMsg) {
      this.message(item, displayTime);
    }
  }

}
