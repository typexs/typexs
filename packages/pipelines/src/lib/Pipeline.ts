/* eslint-disable */

import { get, isArray, isFunction, map } from 'lodash';
import { Processor } from './Processor';
import { Log } from '@typexs/base';
import { ERROR_FUNCTION } from './Constants';
import { IPipeline } from './pipeline/IPipeline';
import { ProcessorPipeHandle } from './pipeline/ProcessorPipeHandle';
import { FunctionPipeHandle } from './pipeline/FunctionPipeHandle';
import { PipeHandle } from './pipeline/PipeHandle';


export class Pipeline implements IPipeline {
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

  errorCallback: ERROR_FUNCTION;

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

  }


  createHandleId() {
    return this.$_handleId++;
  }

  findHandle(fn: any) {
    return this.$handles.find(fn);
  }


  use(options: Function | PipeHandle | Processor) {
    this.$__fn = null;
    if (options instanceof Processor) {
      const ph = new ProcessorPipeHandle(this, options);
      this.$handles.push(ph);
    } else if (options instanceof PipeHandle) {
      this.$handles.push(options);
    } else if (isFunction(options)) {
      const ph = new FunctionPipeHandle(this, options);
      this.$handles.push(ph);
    } else {
      throw new Error('Undefined!');
    }
  }

  _call_handles(method: string, done: Function) {
    let $p: Promise<any> = Promise.all(this.$handles.map((handle) => {
      if(handle[method]){
        return handle[method].call(handle);
      }
      return null;
    }));
    if (done) {
      $p = $p.then(function(res) {
        done(null, res);
      }).catch(function(e) {
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

      self.$__fn = function(_data: any) {
        let $p = new Promise(function(resolve, reject) {
          resolve(_data);
        });

        self.$handles.forEach(function(handle) {
          $p = $p.then((data: any) => {
            if (data) {
              if (isArray(data) && !get(self.$options, 'passArray', false)) {
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
        return $p.catch(e => self.handleError(e, data));
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
        .catch(e => this.handleError(e, data));
    } else {
      try {
        $p = this._execute_call(data);
      } catch (e) {
        this.handleError(e, data);
      }
    }
    return $p;
  }


  setErrorCallback(e: ERROR_FUNCTION) {
    this.errorCallback = e;
  }

  private handleError(e: Error, data: any) {
    this.errorCallback ? this.errorCallback(e, data) : Log.error(e);
  }

}




