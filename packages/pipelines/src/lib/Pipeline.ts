/* eslint-disable */

import * as _ from 'lodash';
import {Processor} from './Processor';
import {Log} from '@typexs/base';
import { get } from 'lodash';


export class Pipeline {
  static ID = 0;

  $id: number;
  $_handleId: number;
  $waiting: boolean;

  $parallel: number;
  $options: any;
  $running: number;
  $__fn: Function;
  $handles: any[];
  $src: any;
  $queue: any[];
  $finish_callback: Function;

  errorCallback: Function;

  _prepared: boolean;
  _closed: boolean;

  constructor(options: any) {
    // super()

    this.$id = Pipeline.ID++;
    this.$_handleId = 0;
    this.$waiting = false;
    this.$options = options || {};
    this.$parallel = 30;
    this.$running = 0;
    this.$__fn = null;
    this.$handles = [];
    this.$src = null;

    this.$queue = [];
    this.$finish_callback = null;

    // let self = this

    /*
    this.on('finish', self.doFinish)
    this.on('next', self.next)
    */
  }


  findHandle(fn: any) {
    return this.$handles.find(fn);
  }


  use(options: any) {
    this.$__fn = null;
    if (options instanceof Processor) {
      const ph = new ProcessorPipeHandle(this, options);
      this.$handles.push(ph);
    } else if (_.isFunction(options)) {
      const ph = new FunctionPipeHandle(this, options);
      this.$handles.push(ph);
    } else {
      throw new Error('Undefined!');
    }
    /*
     this.$processor_desc.push({name: name, options: options})
     */
  }

  _call_handles(method: string, done: Function) {
    let $p: Promise<any> = Promise.all(_.map(this.$handles, (handle) => {
      return handle[method].call(handle);
    }));
    if (done) {
      $p = $p.then(function (res) {
        done(null, res);
      }).catch(function (e) {
        Log.error(e);
        done(e, null);
      });
    } else {

    }
    return $p;
  }

  prepare(done?: Function) {
    this._prepared = true;
    return this._call_handles('prepare', done);
  }

  close(done?: Function) {
    this._closed = true;
    return this._call_handles('close', done);
  }

  collect(done?: Function) {
    return this._call_handles('collect', done);
  }

  _execute_call(data: any) {
    const self = this;

    if (!self.$__fn) {

      self.$__fn = function (_data: any) {
        let $p = new Promise(function (resolve, reject) {
          resolve(_data);
        });

        self.$handles.forEach(function (handle) {
          $p = $p.then((data: any) => {
            if (data) {
              if (_.isArray(data)  && !get(self.$options, 'passArray', false)) {
                const promises = [];
                for (const _data of data) {
                  promises.push(handle.execute.bind(handle)(_data));
                }
                return Promise.all(promises);
              } else {
                return handle.execute.bind(handle)(data);
              }
            } else {
              return handle.execute.bind(handle)(data);
            }
          });
        });
        return $p.catch(e => self.handleError(e));
      };
    }
    return self.$__fn(data);
  }


  execute(data: any) {
    let $p = null;
    const self = this;
    if (!this._prepared) {
      $p = this.prepare()
        .then(self._execute_call.bind(self, data))
        .catch(e => this.handleError(e));
    } else {
      try {
        $p = this._execute_call(data);
      } catch (e) {
        this.handleError(e);
      }
    }
    return $p;
  }


  setErrorCallback(e: Function) {
    this.errorCallback = e;
  }

  private handleError(e: Error) {
    this.errorCallback ? this.errorCallback(e) : Log.error(e);
  }

}


export abstract class PipeHandle {

  _pipeline: any;
  _handleId: any;
  _initialized: boolean;
  _queue: any[];


  constructor(PL: Pipeline) {
    this._pipeline = PL;
    this._handleId = PL.$_handleId++;
    this._initialized = false;
    this._queue = [];
  }

  get pipeline() {
    return this._pipeline;
  }

  prepare() {
    this._initialized = true;
  }

  abstract execute(data: any): any;

  close() {
  }

  collect() {
  }


}

export class ProcessorPipeHandle extends PipeHandle {
  _processor: Processor;

  constructor(PL: Pipeline, proc: Processor) {
    super(PL);
    this._processor = proc;
    proc.$pipe_handle = this;
  }

  prepare() {
    super.prepare();
    return this._processor.prepare();
  }

  execute(data: any) {
    return this._processor.process(data);
  }

  close() {
    return this._processor.finish();
  }

  collect() {
    return this._processor.collect();
  }
}

class FunctionPipeHandle extends PipeHandle {

  constructor(PL: Pipeline, fn: Function) {
    super(PL);
    this._function = fn;
  }

  _function: any;

  static createPipePromise(pipe: any, data: any, self: any) {
    return new Promise(function (res, rej) {
      if (pipe.length === 2) {
        pipe.call(self, data, function (err: Error, _res: any) {
          if (err) {
            rej(err);
          } else {
            if (_res) {
              res(_res);
            } else {
              res(data);
            }
          }
        });
      } else {
        try {

          const _res = pipe.call(self, data);

          if (_res) {
            res(_res);
          } else {
            res(data);
          }

        } catch (err) {
          rej(err);
        }
      }
    });
  }

  execute(data: any) {
    return FunctionPipeHandle.createPipePromise(this._function, data, this);
  }

}
