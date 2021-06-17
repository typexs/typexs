import {Component, OnInit} from '@angular/core';
import {InputDemoObject} from '../../../entities/InputDemoObject';
import {IMessage, MessageType} from '@typexs/base-ng';
import {MessageChannel} from '@typexs/base-ng';
import {MessageService} from '@typexs/base-ng';
import {LogMessage} from '@typexs/base-ng';


@Component({
  selector: 'inputDemo',
  templateUrl: 'input-demo.component.html',
})
export class InputDemoComponent implements OnInit {

  object01: any;

  result: any;

  channel: MessageChannel<IMessage>;


  constructor(private messageService: MessageService) {
    this.channel = this.messageService.get('form.input_demo');
  }


  ngOnInit() {
    this.object01 = new InputDemoObject();
  }


  onSubmit($event: any) {
    this.result = $event;

    const msg = new LogMessage();
    msg.type = $event.data.isSuccessValidated ? MessageType.SUCCESS : MessageType.ERROR;
    msg.content = $event.data.isSuccessValidated ?
      'Successful submitted and validated.' : 'Error on validation.';

    this.channel.publish(msg);
    this.messageService.getLogService().publish(msg);
  }
}
