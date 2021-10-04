import * as _ from 'lodash';
import { remove } from 'lodash';
import { EventEmitter } from 'events';
import { IAsyncQueueOptions } from './IAsyncQueueOptions';
import { IQueueProcessor } from './IQueueProcessor';
import { IQueueWorkload } from './IQueueWorkload';
import { QueueJob } from './QueueJob';
import { Log } from '../logging/Log';
import { IAsyncQueueStats } from './IAsyncQueueStats';
import { ILoggerApi } from '../logging/ILoggerApi';
import { E_DO_PROCESS, E_DRAIN, E_ENQUEUE, E_NO_RUNNING_JOBS } from './Constants';


const ASYNC_QUEUE_DEFAULT: IAsyncQueueOptions = {
  name: 'none',
  concurrent: 5
};


export class AsyncWorkerQueue<T extends IQueueWorkload> extends EventEmitter {


  _inc = 0;

  _done = 0;

  _error = 0;

  _paused = false;

  options: IAsyncQueueOptions;

  processor: IQueueProcessor<T>;

  runningTasks = 0;

  worker: Array<QueueJob<T>> = [];

  active: Array<QueueJob<T>> = [];

  logger: ILoggerApi;


  constructor(processor: IQueueProcessor<T>, options: IAsyncQueueOptions = { name: 'none' }) {
    super();
    this.setMaxListeners(10000);
    this.options = _.defaults(options, ASYNC_QUEUE_DEFAULT);
    this.logger = _.get(this.options, 'logger', Log.getLoggerFor(AsyncWorkerQueue, { prefix: this.options.name }));
    this.processor = processor;
    this.on(E_DO_PROCESS, this.process.bind(this));
    this.on(E_ENQUEUE, this.enqueue.bind(this));
    this.on(E_DRAIN, this.drained.bind(this));
  }

  private next() {
    this.runningTasks--;

    this.logger.debug('inc=' + this._inc + ' done=' + this._done + ' error=' + this._error +
      ' running=' + this.running() + ' todo=' + this.enqueued() + ' active=' + this.active.length);
    if (this.isPaused()) {
      if (!this.isRunning()) {
        this.emit(E_NO_RUNNING_JOBS);
      }
    } else {
      this.fireProcess();
    }

  }

  status(): IAsyncQueueStats {
    return {
      all: this._inc,
      done: this._done,
      running: this.running(),
      enqueued: this.enqueued(),
      active: this.active.length
    };
  }


  private async process() {
    // ignore if is paused
    if (this._paused) {
      return;
    }

    if (!this.isOccupied() && this.enqueued() > 0) {
      // room for additional job
      const worker = this.worker.shift();
      this.active.push(worker);

      this.runningTasks++;

      this._inc++;
      worker.doStart();
      try {
        const res = await this.processor.do(worker.workload(), this);
        worker.setResult(res);
      } catch (e) {
        this._error++;
        this.logger.error(e);
      } finally {
        remove(this.active, x => x === worker);
        worker.doStop();
        this.next();
      }

      // Promise.resolve(worker)
      //   .then((_worker) => {
      //     this._inc++;
      //     _worker.doStart();
      //     return _worker;
      //   })
      //   .then(async (_worker) => {
      //     const res = await this.processor.do(_worker.workload(), this);
      //     _worker.setResult(res);
      //     return _worker;
      //   })
      //   .then((_worker) => {
      //     _.remove(this.active, _worker);
      //     _worker.doStop();
      //     this._done++;
      //     this.next();
      //   })
      //   .catch((err) => {
      //     _.remove(this.active, worker);
      //     worker.doStop(err);
      //     this._error++;
      //     this.next();
      //     this.logger.error(err);
      //   });

    } else {
      if (this.amount() === 0) {
        // notthing to do
        this.emit(E_DRAIN);
      } else {
        // worker exists and occupied
      }
    }
  }


  private enqueue(job: QueueJob<T>) {
    this.worker.push(job);
    job.doEnqueue();
    this.fireProcess();
  }

  private drained() {
    if (this.processor.onEmpty) {
      this.processor.onEmpty();
    }
  }

  private fireProcess() {
    this.emit(E_DO_PROCESS);
  }


  /**
   * all processed queue is empty
   */
  await(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.amount() > 0) {
        this.once(E_DRAIN, function() {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }


  /**
   * Creates a new QueueJob for passed entry and return a promise which that the job will be enqueued
   *
   * @param entry
   * @returns {QueueJob<T>}
   */
  push(entry: T): QueueJob<T> {
    const _entry: QueueJob<T> = new QueueJob(this, entry);
    // let $p = _entry.enqueued();
    this.emit(E_ENQUEUE, _entry);
    return _entry;
  }


  running() {
    return this.runningTasks;
  }


  enqueued() {
    return this.worker.length;
  }

  amount() {
    return this.running() + this.enqueued();
  }

  isPaused() {
    return this._paused;
  }

  isRunning() {
    return this.runningTasks > 0;
  }

  isIdle() {
    return this.enqueued() + this.runningTasks === 0;
  }

  isOccupied() {
    return this.runningTasks >= this.options.concurrent;
  }

  // TODO impl
  pause(): Promise<boolean> {
    this._paused = true;
    return new Promise((resolve) => {
      if (this.isRunning()) {
        this.once(E_NO_RUNNING_JOBS, () => {
          resolve(this._paused);
        });
      } else {
        resolve(this._paused);
      }
    });
  }

  // TODO impl
  resume() {
    this._paused = false;
    for (let i = 0; i < this.options.concurrent; i++) {
      this.fireProcess();
    }
  }

  async shutdown(doAwait: boolean = false) {
    if (doAwait) {
      await this.await();
    }
    await this.pause();
    this.logger = null;
    this.processor = null;
    this.worker.map(jobs => jobs.finalize());
    this.active.map(jobs => jobs.finalize());
    this.worker = null;
    this.active = null;
    this.removeAllListeners();
  }

}
