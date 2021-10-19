import {AsyncWorkerQueue, IQueueProcessor} from '@typexs/base';
import {AbstractReader} from '../../../lib/reader/AbstractReader';
import {IQueuedReaderOptions} from '../../../lib/reader/IQueuedReaderOptions';
import {IReader} from '../../../lib/reader/IReader';

/**
 * Queued reader listens for data
 */
export class QueuedReader extends AbstractReader implements IQueueProcessor<any> {


  $queue: AsyncWorkerQueue<any>;

  constructor(opts: IQueuedReaderOptions = {}) {
    super(QueuedReader.name, opts);
    this.$queue = new AsyncWorkerQueue<any>(this, {name: 'queued-reader'});
  }


  push(data: any) {
    return this.$queue.push(data);
  }


  do(workLoad: any): Promise<any> {
    return this.doProcess(workLoad);
  }


  onCatch(pipe: Function): IReader {
    return null;
  }


  doRun() {
    super.doRun();
  }

  onFinish(): Promise<any> {
    return Promise.resolve(undefined);
  }

}
