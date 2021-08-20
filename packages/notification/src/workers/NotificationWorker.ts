import {AsyncWorkerQueue, IQueueProcessor, IWorker} from '@typexs/base';

export interface IEventTrigger {
  adapter: string;
  event: any;
}

export class NotificationWorker extends AsyncWorkerQueue<IEventTrigger> implements IWorker, IQueueProcessor<IEventTrigger> {
  name: string = 'notification_worker';

  finish(): void {
  }

  prepare(options?: any): void {
    // subscribe on events
    // load adapter
  }

  register() {
  }

  unregister() {
  }

  // subscribe
  // based on configuration find definitions
  // foreach config for this event enqueue EventTrigger info
  onEvent(event: any) {


  }

  do(workLoad: IEventTrigger): Promise<any> {
    return Promise.resolve(undefined);
  }
}
