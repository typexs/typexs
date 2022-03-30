/* eslint-disable */
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import { ProcessingHelper } from './ProcessingHelper';
import { ILoggerApi, Log } from '@typexs/base';
import { IProcessor } from './processor/IProcessor';
import { IProcessorOptions } from './processor/IProcessorOptions';
import { PipeHandle } from './pipeline/PipeHandle';


const handleCallResults = function(res: any, cb: any, data: any) {
  if (res) {
    if (ProcessingHelper.isPromise(res)) {
      // Log.info('asdasdasd3 ');
      // const x = setTimeout(() => {
      //   Log.error('timeout', res, cb, data);
      // }, 60000);
      res.then((_res: any) => {
        // clearTimeout(x);
        // Log.info('asdasdasd4 ');
        if (_res) {
          cb(null, _res);
        } else {
          cb(null, data);
        }
      }).catch((err: Error) => {
        // clearTimeout(x);
        // Log.error('asdasdasd5 ', err.stack);
        cb(err);
      });
    } else {
      cb(null, res);
    }
  } else {
    cb(null, data);
  }

};


export abstract class Processor extends EventEmitter implements IProcessor {


  constructor(options: IProcessorOptions = {}) {
    super();

    this.$options = options || {};
    this.logger = _.get(options, 'logger', Log.getLogger());
    // this.$_name_ = options['_name_'] || 'unknown'

    // TODO @depreacted
    this.$broker = null;

    // if the processor is bound to an pipeline
    this.$pipe_handle = null;

    this.$process_time = 0;
    this.$process_calls = 0;
    const self = this;

    this.on('error', (err: Error) => Log.error(err));

    this.on('process', this.processEvent.bind(this));

    this.on('init', function(cb) {
      if (self.doInit.length === 0) {
        try {
          const res = self.doInit();
          // Log.info('init ' + self.$process_calls);
          handleCallResults(res, cb, null);
        } catch (err) {
          cb(err);
        }

      } else {
        self.doInit(cb);
      }
    });

    this.on('finish', function(cb) {

      if (self.doFinish.length === 0) {
        try {
          const res = self.doFinish();
          handleCallResults(res, cb, null);
        } catch (err) {
          cb(err);
        }
      } else {
        self.doFinish(cb);
      }
    });

  }

  async processEvent(data: any, cb: Function) {
    const start = new Date();
    Log.info('process ' + this.$process_calls + ' cb? ' + !!cb);
    if (this.doProcess.length === 1) {
      try {
        // Log.info('asdasdasd1 ' + this.$process_calls);
        const res = this.doProcess(data);

        this.$process_calls++;
        this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));

        // Log.info('asdasdasd2 ' + this.$process_calls + ' ' + this.$process_time);
        handleCallResults(res, cb, data);

      } catch (err) {
        // Log.error('asdasdasd-err2 ' + this.$process_calls, err);
        this.$process_calls++;
        this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));
        cb(err, null);
      }

    } else {
      this.doProcess(data, function(err: Error, res: any) {
        this.$process_calls++;
        this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));
        if (err) {
          cb(err, res);
        } else {
          if (res) {
            cb(null, res);
          } else {
            cb(null, data);
          }
        }

      });
    }

  }

  // set broker(b) {
  //   this.$broker = b;
  // }
  //
  // get broker() {
  //   return this.$broker;
  // }


  logger: ILoggerApi;

  $options: any;
  $broker: any;
  private $pipe_handle: PipeHandle;
  $process_time: any;
  $process_calls: any;
  $pipeline: any;

  setPipeHandle(p: PipeHandle) {
    this.$pipe_handle = p;
  }

  static createEmitPromise(eventname: string, self: any, ...args: any[]) {
    return new Promise(function(resolve, reject) {
      args.push(function(err: Error, res: any) {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
      args.unshift(eventname);
      self.emit.apply(self, args);
    });
  }


  /**
   * @deprecated
   * @param pipeline
   */
  init(pipeline: any) {
    // TODO @deprected pipeline reference!
    this.$pipeline = pipeline;
    return Processor.createEmitPromise('init', this);
  }

  prepare() {
    return Processor.createEmitPromise('init', this);
  }

  /**
   * initialisation routines for a processor
   * can have done callback or no
   * can return a promise
   *
   * @param cb
   */
  doInit(cb?: Function) {
    if (cb) {
      cb(null, null);
    }
  }

  /**
   * can have one parameter data or two data with a done callback
   * also with one parameter a promise can be returned
   *
   * @param data
   * @param cb
   */
  abstract doProcess(data: any, cb?: Function): void;


  /**
   * closeing routine for a processor
   * can have done callback or no
   * can return a promise
   *
   * @param cb
   */
  doFinish(cb?: Function) {
    if (cb) {
      cb(null, null);
    }
  }


  // process(data: any) {
  //   return Processor.createEmitPromise('process', this, data);
  // }


  process(data: any) {
    return new Promise(async (resolve, reject) => {
      const start = new Date();
      if (this.doProcess.length === 1) {
        try {
          const res = await this.doProcess(data);
          this.$process_calls++;
          this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));
          // handleCallResults(res, cb, data);
          resolve(res);
        } catch (err) {
          this.$process_calls++;
          this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));
          reject(err);
        }

      } else {
        // by callback
        this.doProcess(data, (err: Error, res: any) => {
          this.$process_calls++;
          this.$process_time = (this.$process_time + (new Date().getTime() - start.getTime()));
          if (err) {
            reject(err);
          } else {
            resolve(res ? res : data);
          }
        });
      }
    });


  }


  finish() {
    const res = Processor.createEmitPromise('finish', this);
    this.removeAllListeners();
    return res;
  }


  async collect() {
    return {
      calls: this.$process_calls,
      last_timestamp: this.$process_time
    };
  }

}

