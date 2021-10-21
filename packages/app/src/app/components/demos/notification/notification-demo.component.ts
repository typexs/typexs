import {Component, OnInit} from '@angular/core';
import {NotificationsService} from '@typexs/ng-theme-base';


@Component({
  templateUrl: './notification-demo.component.html',
})
export class NotificationDemoComponent implements OnInit {

  constructor(private notifyService: NotificationsService) {

  }

  ngOnInit(): void {
  }


  show(type: string) {
    this.notifyService.addMessage({
      type: <any>type.toUpperCase(),
      topic: 'Test message',
      content: 'This is a message for you!'

    });
  }
}
