import { defaults, get, isArray, remove } from 'lodash';
import { EventEmitter } from 'events';
import { IAsyncQueueOptions } from './IAsyncQueueOptions';
import { IQueueProcessor } from './IQueueProcessor';
import { IQueueWorkload } from './IQueueWorkload';
import { QueueJob } from './QueueJob';
import { Log } from '../logging/Log';
import { IAsyncQueueStats } from './IAsyncQueueStats';
import { ILoggerApi } from '../logging/ILoggerApi';
import { E_CLEANUP, E_DO_PROCESS, E_DRAIN, E_ENQUEUE, E_NO_RUNNING_JOBS } from './Constants';
import { IQueueArray } from './IQueueArray';
import { CacheArray } from './CacheArray';
import { IQueue } from './IQueue';
import { DefaultArray } from './DefaultArray';
import { QueueJobRef } from './QueueJobRef';


const ASYNC_QUEUE_DEFAULT: IAsyncQueueOptions = {
  name: 'none',
  concurrent: 5,
  cleanupTimeout: 60000
};


export class AsyncWorkerQueue<T extends IQueueWorkload> extends EventEmitter implements IQueue {


  private _inc = 0;

  private _done = 0;

  private _error = 0;

  private _paused = false;

  private enqueueing = 0;

  private options: IAsyncQueueOptions;

  private processor: IQueueProcessor<T>;

  private runningTasks = 0;

  private all: IQueueArray<QueueJob<T>>;

  private worker: string[] = [];

  private done: { id: string; ts: number }[] = [];

  private active: Array<QueueJob<T>> = [];

  private logger: ILoggerApi;

  private concurrent: number = 5;

  private maxConcurrent: number = 5;


  constructor(processor: IQueueProcessor<T>, options: IAsyncQueueOptions = { name: 'none' }) {
    super();
    this.setMaxListeners(10000);
    this.options = defaults(options, ASYNC_QUEUE_DEFAULT);
    this.concurrent = this.maxConcurrent = this.options.concurrent;
    this.logger = get(this.options, 'logger', Log.getLoggerFor(AsyncWorkerQueue, { prefix: this.options.name }));
    this.processor = processor;
    if (this.options.cache) {
      // this.worker = new CacheArray(this.options.cache, QueueJob);
      this.all = new CacheArray(this.options.cache, QueueJob);
    } else {
      // this.worker = new DefaultArray<QueueJob<T>>();
      this.all = new DefaultArray<QueueJob<T>>();
    }
    this.on(E_DO_PROCESS, this.process.bind(this));
    this.on(E_ENQUEUE, this.enqueue.bind(this));
    this.on(E_DRAIN, this.drained.bind(this));
    this.on(E_CLEANUP, this.cleanup.bind(this));
  }


  getInc() {
    return this._inc;
  }

  getLogger(){
    return this.logger;
  }

  private cleanup() {
    const end = (new Date().getTime()) - this.options.cleanupTimeout;
    const removed = remove(this.done, x => x.ts <= end);

    for (const r of removed) {
      this.all.remove(r.id);
    }
  }


  private next() {
    // TODO idle?
    this.logger.debug(
      'inc=' + this._inc + ' ' +
      'done=' + this._done + ' ' +
      'error=' + this._error + ' ' +
      'running=' + this.running() + ' ' +
      'todo=' + this.enqueued() + ' ' +
      'active=' + this.active.length
    );

    if (this.processor.onNext) {
      this.processor.onNext();
    }

    if (this.isPaused()) {
      if (!this.isRunning()) {
        this.emit(E_NO_RUNNING_JOBS);
      }
    } else {
      this.fireProcess();
    }
  }


  getConcurrent() {
    return this.concurrent;
  }

  speedUp() {
    if (this.concurrent < this.maxConcurrent) {
      this.concurrent++;
    }
  }

  speedDown() {
    if (this.concurrent > 1) {
      this.concurrent--;
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
      this.runningTasks++;
      const workerId: string = this.worker.shift();
      const worker: QueueJob<T> = await this.get(workerId);
      // if (isArray(this.worker)) {
      //   worker = this.worker.shift();
      // } else {
      //   worker = await this.worker.shift();
      // }

      worker.prepare(this);
      this.active.push(worker);


      this._inc++;
      await worker.doStart(this);
      let error = null;
      try {
        const workload = await worker.workload();
        const res = await this.processor.do(workload, this);
        worker.setResult(res);
        this._done++;
      } catch (e) {
        error = e;
        worker.setError(e);
        this._error++;
        this.logger.error(e);
      } finally {
        remove(this.active, x => x.id === worker.id);
        await worker.doStop(this, error);
        this.done.push({ id: workerId, ts: (new Date().getTime()) });
        this.runningTasks--;
        this.next();
      }
      if (this.amount() === 0) {
        // notthing to do
        this.emit(E_DRAIN);
      } else {
        if (this._inc % 20 === 0) {
          this.emit(E_CLEANUP);
        }
      }
    }
  }


  private async enqueue(job: QueueJob<T>) {
    this.enqueueing++;
    let error = null;
    if (isArray(this.all)) {
      this.all.push(job);
    } else {
      try {
        await this.all.push(job);
      } catch (e) {
        this.logger.error(e);
        error = e;
      }
    }
    this.enqueueing--;
    if (!error) {
      this.worker.push(job.id);
      await job.doEnqueue(this);
      this.fireProcess();
    }
  }


  private drained() {
    if (this.processor.onEmpty) {
      this.processor.onEmpty();
    }
    this.emit(E_CLEANUP);
  }

  private fireProcess() {
    this.emit(E_DO_PROCESS);
  }

  get(id: string): Promise<QueueJob<T>> | QueueJob<T> {
    return this.all.get(id);
  }

  set(x: QueueJob<T>) {
    return this.all.set(x);
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
  push(entry: T): QueueJobRef<T> {
    const _entry: QueueJob<T> = new QueueJob(entry);
    const id = _entry.id;
    this.emit(E_ENQUEUE, _entry);
    return new QueueJobRef<T>(this, id);
  }


  running() {
    return this.runningTasks;
  }

  doingEnqueueing() {
    return this.enqueueing;
  }

  enqueued() {
    return this.worker.length;
  }

  amount() {
    return this.running() + this.enqueued() + this.doingEnqueueing();
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
    return this.runningTasks >= this.getConcurrent();
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
    for (let i = 0; i < this.getConcurrent(); i++) {
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

    await Promise.all(this.worker.map(async k => {
      (await this.get(k)).finalize(this);
    }));

    this.active.map(jobs => jobs.finalize(this));
    this.worker = null;
    this.active = null;
    this.removeAllListeners();
  }

}
