import {defaults} from 'lodash';
import {Component, Input, OnInit} from '@angular/core';
import {NotificationsService} from './notifications.service';
import {NotifyItem} from './NotifyItem';
import {INotifyOptions} from './INotifyOptions';

const DEFAULT_OPTIONS: INotifyOptions = {displayTime: 10000, maxAlerts: 10};

@Component({
  selector: 'bat-notify',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

  @Input()
  options: INotifyOptions;

  items: NotifyItem[] = [];


  constructor(private service: NotificationsService) {
    service.OnAddMessage.subscribe((msg: NotifyItem) => this.onAddMessage(msg));
    service.OnRemoveMessage.subscribe((msg: NotifyItem) => this.onRemoveMessage(msg));
  }


  ngOnInit(): void {
    defaults(this.options, DEFAULT_OPTIONS);
    this.service.displayTime = this.options.displayTime;
  }


  close(index: number, done?: () => void) {
    if (typeof index !== 'number') {
      return;
    }
    this.onRemoveMessage(this.items[index], done);
  }


  onAddMessage(msg: NotifyItem) {
    if (this.items.length && this.options.maxAlerts && this.options.maxAlerts <= this.items.length) {
      this.close(this.items.length - 1, () => {
        this.items.unshift(msg);
      });
    } else {
      this.items.unshift(msg);
    }
  }


  onRemoveMessage(msg: NotifyItem, done?: () => void) {
    if (!msg || !this.items || !this.items.length) {
      return;
    }

    let curMsg: NotifyItem;
    let curMsgIdx: number;
    for (curMsgIdx = 0; curMsgIdx < this.items.length; curMsgIdx++) {
      if (this.items[curMsgIdx] && this.items[curMsgIdx].id === msg.id) {
        curMsg = this.items[curMsgIdx];
        break;
      }
    }

    if (!curMsg || curMsg.closing) {
      return;
    }

    curMsg.closing = true;
    setTimeout(() => {
      this.items.splice(curMsgIdx, 1);
      if (done) {
        done();
      }
    }, 350);
  }

}
