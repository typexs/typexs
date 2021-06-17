import {isNull} from 'lodash';
import {MessageType} from '@typexs/base-ng';


export class NotifyItem {
  heading?: string;
  message?: string;
  type: MessageType;

  id: number;
  closing?: boolean;
  time: number;


  getTypeAsLowerCase(): string {
    if (!isNull(this.type)) {
      const name = MessageType[this.type];
      return name.toLowerCase();
    }
    return null;

  }

}
