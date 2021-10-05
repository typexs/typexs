import { IQueueWorkload } from './IQueueWorkload';
import { IQueue } from './IQueue';
import { CryptUtils } from '@allgemein/base';
import { QJ_ENQUEUED, QJ_START, QJ_STOP } from './Constants';
import { IdObject } from './IdObject';


export class QueueJob<T extends IQueueWorkload> implements IdObject {

  private static _INC = 0;

  private _id: string;

  // private _queue: IQueue;

  private _workload: T;

  private _start: Date = null;

  private _stop: Date = null;

  private _enqueued: Date = null;

  private _duration: number;

  private _error: Error = null;

  private _result: any = null;

  constructor(/* queue: IQueue, */workload: T) {
    this._workload = workload;
    // this._queue = queue;
    this._id = CryptUtils.shorthash((new Date()).getTime() + '' + (QueueJob._INC++));
    // this._queue.once(this.jobEventName('stop'), this.onDone.bind(this));
  }

  prepare(queue: IQueue) {
    queue.once(this.jobEventName(QJ_STOP), this.onDone.bind(this, queue));
  }

  public get id(): string {
    return this._id;
  }

  public workload(): T {
    return this._workload;
  }

  public enqueued(queue: IQueue): Promise<QueueJob<T>> {
    return new Promise((resolve) => {
      if (!this._enqueued) {
        queue.once(this.jobEventName(QJ_ENQUEUED), (job: QueueJob<T>) => {
          resolve(job);
        });
      } else {
        resolve(this);
      }
    });
  }

  getResult() {
    return this._result;
  }

  setResult(v: any) {
    this._result = v;
  }

  getError() {
    return this._error;
  }

  setError(v: any) {
    this._error = v;
  }

  /**
   * Wait till the job is begins
   */
  public starting(queue: IQueue): Promise<QueueJob<T>> {
    return new Promise((resolve) => {
      if (!this._start) {
        queue.once(this.jobEventName(QJ_START), () => {
          resolve(this);
        });
      } else {
        // if started then pass through
        resolve(this);
      }
    });
  }

  /**
   * Wait till the job is finished
   */
  public done(queue: IQueue): Promise<QueueJob<T>> {
    return new Promise((resolve, reject) => {
      if (!this._stop) {
        queue.once(this.jobEventName(QJ_STOP), (err: Error = null) => {
          if (err) {
            reject(err);
          } else {
            resolve(this);
          }
        });
      } else {
        // if stopped then pass through
        resolve(this);
      }
    });
  }

  /**
   * Fire event that the job was enqueued
   */
  public async doEnqueue(queue: IQueue) {
    this._enqueued = new Date();
    await queue.set(this);
    queue.emit(this.jobEventName(QJ_ENQUEUED), this);
  }

  /**
   * Fire event that the job was started
   */
  public async doStart(queue: IQueue) {
    this._start = new Date();
    await queue.set(this);
    queue.emit(this.jobEventName(QJ_START));
  }

  /**
   * Fire event that the job was stopped
   */
  public async doStop(queue: IQueue, err: Error = null) {
    this._error = err;
    this._stop = new Date();
    this._duration = this._stop.getTime() - this._start.getTime();
    await queue.set(this);
    queue.emit(this.jobEventName(QJ_STOP), err);
  }

  /**
   * Check if the job is enqueued
   */
  public isEnqueued(): boolean {
    return this._enqueued != null && this._start == null && this._stop == null;
  }

  /**
   * Check if the job is started
   */
  public isStarted(): boolean {
    return this._enqueued != null && this._start != null && this._stop == null;
  }

  /**
   * Check if the job is finished
   */
  public isFinished(): boolean {
    return this._enqueued != null && this._start != null && this._stop != null;
  }


  /**
   * Fired when the job is finished
   */
  private onDone(queue: IQueue) {
    this.finalize(queue);
  }


  /**
   * Clear references to the _queue object
   */
  finalize(queue: IQueue) {
    if (!this._stop) {
      this.doStop(queue);
    }
    queue.removeAllListeners(this.jobEventName(QJ_START));
    queue.removeAllListeners(this.jobEventName(QJ_STOP));
    queue.removeAllListeners(this.jobEventName(QJ_ENQUEUED));
  }


  /**
   * Helper generating the event names for different jobs id and states
   *
   * @param type
   */
  private jobEventName(type: 'start' | 'stop' | 'enqueued') {
    return `job ${this._id} ${type}`;
  }

}
