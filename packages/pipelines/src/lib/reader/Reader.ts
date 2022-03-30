/* eslint-disable */
import * as _ from 'lodash';
import { IReaderOptions } from './IReaderOptions';
import { IPullable } from '../IPullable';
import { PullingQueue } from '../PullingQueue';
import { IReader } from './IReader';
import { AbstractReader } from './AbstractReader';

/**
 * TODO Rename to
 */
export abstract class Reader extends AbstractReader implements IPullable, IReader {

  $queue: PullingQueue;

  constructor(type: string, options: IReaderOptions) {
    super(type, options);
    this.$queue = new PullingQueue(options);
    this.$queue.pullOn(this);
    this.$queue.onData(this.doProcess.bind(this));
  }

  onCatch(pipe: Function) {
    if (_.isFunction(pipe)) {
      this.$queue.onCatch(pipe);
    }
    return super.onCatch(pipe);
  }

  onFinish(): Promise<any> {
    return this.$queue.onFinish() as Promise<any>;
  }

  doRun() {
    this.$queue.run();
  }


// from Pullable class
  abstract hasNext(): boolean | Promise<boolean>;


// from Pullable class
  abstract doFetch(done?: Function): any;


  enqueue(data: any) {
    this.$queue.enqueue(data);
  }
}
