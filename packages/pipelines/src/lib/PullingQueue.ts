/* eslint-disable */

import { EventEmitter } from 'events';
import { Log } from '@typexs/base';
import { FINISHED, WAITING } from './queue/Constants';
import { IPullableQueueOptions } from './queue/IPullableQueueOptions';
import { ERROR_FUNCTION } from './Constants';
import { get, isArray, isFunction } from '@typexs/generic';


// TODO Work in progress!!!
export class PullingQueue extends EventEmitter {
  $options: IPullableQueueOptions;
  $reties: any;
  $error_timeout: any;
  $min_flush_queue: number;
  $concurrency: number;
  $fetch_limit: number;
  $enqueued: number;
  $processed: number;
  $iterations: number;
  $fetching: number;
  $running: number;
  $started: Date;
  $stopped: Date;
  $pullable: any;
  $state: any;
  $queue: any;
  $callbacks: any;

  $__fn: Function;

  constructor(options: IPullableQueueOptions) {
    super();
    options = options || {};

    this.$options = options || {};
    this.$reties = options['error_retries'] || 5;
    this.$error_timeout = options['error_timeout'] || 1000;

    this.$min_flush_queue = options['min_flush_queue'] || 1;
    this.$concurrency = options['concurrency'] || 30;
    this.$fetch_limit = options['fetch_limit'] || 100;
    // this.$chunk_limit = options['chunk_limit'] || 1

    this.$enqueued = 0;
    this.$processed = 0;
    this.$iterations = 0;
    this.$fetching = 0;
    this.$running = 0;
    this.$started = new Date();
    this.$stopped = this.$started;

    this.$pullable = null;
    this.$state = {};
    this.$queue = [];

    this.$callbacks = [];

    this.on('enqueue', this._enqueue.bind(this));
    this.on('next', this.next.bind(this));
    this.on('fetch', this.doFetch.bind(this));
    this.on('hasNext', this.doHasNext.bind(this));
    this.on('data', this.data.bind(this));
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

  $onCatch: ERROR_FUNCTION = (error: Error, data: any) => {
    Log.error('pulling', error, data);
  };


  keepAlive() {
    return get(this.$options, 'keepAlive', false);
  }

  state(state_on_off: string | number, value: any) {
    this.$state[state_on_off] = value;
    return this.$state[state_on_off];
  }


  isState(state_on_off: string | number) {
    if (this.$state.hasOwnProperty(state_on_off)) {
      return this.$state[state_on_off];
    } else {
      return false;
    }
  }


  onCatch(pipe: ERROR_FUNCTION) {
    if (isFunction(pipe)) {
      this.$onCatch = pipe;
    }
    return this;
  }

  pullOn(pullable: any) {
    if (isFunction(pullable.hasNext) && isFunction(pullable.doFetch)) {
      this.$pullable = pullable;
    } else {
      throw new Error('function is not of Pullable');
    }
    return this;
  }


  _data() {
    // console.log('data',this.$queue.length,this.$iterations, this.$concurrency)
    if (this.$queue.length > 0) {
      const self = this;
      // let running = this.$enqueued - this.$processed
      if (this.$iterations < this.$concurrency) {
        if (this.$min_flush_queue <= 1) {
          const data = this.$queue.shift();
          self.emit('data', data);
        } else if (this.$min_flush_queue > this.$queue.length) {
          // Wenn letzter Chunk dann sollen die restliche Daten weitergereicht werden
          const arr = this.$queue.splice(0, this.$queue.length);
          self.emit('data', arr);
        } else if (this.$min_flush_queue <= this.$queue.length) {
          const length = this.$min_flush_queue;
          const arr = this.$queue.splice(0, length);
          self.emit('data', arr);
        }
      }
    }
  }


  data(data: any) {
    const self = this;

    if (!self.$__fn) {
      self.$__fn = function(_data: any) {
        self.$iterations++;
        const size = isArray(_data) ? _data.length : 1;
        let $p: Promise<any> = new Promise(function(resolve, reject) {
          resolve(_data);
        });

        self.$callbacks.forEach(function(handle: any) {
          // TODO onCatch for a step
          $p = $p.then(handle.bind(self));
        });
        // TODO onCatch for global data process
        $p = $p.catch(self.$onCatch.bind(self, data));
        $p = $p.then(function() {
          self.$processed += size;
          self.$iterations--;
          self._next();
        });
        return $p;
      };
    }
    return self.$__fn(data);
  }


  onData(fn: any) {
    this.$callbacks.push(fn);
    this.$__fn = null;
    return this;
  }

  enqueue(data: any) {
    return PullingQueue.createEmitPromise('enqueue', this, data);
  }

  _enqueue(data: any, done: any) {
    if (!data) {
      return;
    }

    // if(this.$pre_enqueue)

    const size = isArray(data) ? data.length : 1;
    if (isArray(data) && !get(this.$options, 'passArray', false)) {
      this.$enqueued += size;
      this.$queue = this.$queue.concat(data);
    } else {
      this.$enqueued += size;
      this.$queue.push(data);
    }

    const self = this;
    const waitFor = function(_done: any) {
      self.state(WAITING, true);
      if (self.$queue.length <= self.$fetch_limit) {
        self.state(WAITING, false);
        // queue kleiner gleich als fetch wert, dann hebe blockade auf

        if (_done) {
          _done();
        }
        // self._next()
      } else {
        // console.log('waitinh...')
        self._data();
        // TODO make this configurable
        setTimeout(waitFor.bind(this, _done), 10);
      }
    };

    if (!self.isState(WAITING)) {
      waitFor(done);
    } else {
      done();
    }
  }

  run() {
    this.$started = new Date();
    this._next();
  }


  hasNext(): Promise<any> {
    return PullingQueue.createEmitPromise('hasNext', this);
  }


  async doHasNext(done: any) {
    if (this.$pullable.hasNext.length === 1) {
      // with done callback
      await this.$pullable.hasNext(done);
    } else {
      try {
        const res = await this.$pullable.hasNext();
        if (res === false || res === true) {
          done(null, res);
        } else {
          done(new Error('no results!'), null);
        }
      } catch (err) {
        done(err);
      }
    }
  }

  fetch() {
    return PullingQueue.createEmitPromise('fetch', this);
  }

  async doFetch(done: any) {
    if (this.$pullable.doFetch.length === 1) {
      // with done callback
      await this.$pullable.doFetch(done);
    } else {
      try {
        const res = await this.$pullable.doFetch();
        if (res) {
          done(null, res);
        } else {
          done(new Error('no results!'), null);
        }
      } catch (err) {
        done(err);
      }
    }
  }


  _finish(err: Error = null) {

    if (!this.keepAlive() &&
      !this.isState(FINISHED) && this.$fetching === 0) {
      this.state(FINISHED, true);

      this.finish(err);
    }
  }

  finish(err: Error = null) {
    this.$stopped = new Date();
    const stats = {
      processed: this.$processed,
      enqueued: this.$enqueued,
      start: this.$started,
      end: this.$stopped,
      duration: this.$stopped.getTime() - this.$started.getTime()
    };

    this.removeAllListeners('next');
    this.emit('finished', err, stats);
    this.removeAllListeners();
  }

  _next() {
    if (!this.isState(FINISHED)) {
      this.emit('next');
    }
  }


  next() {
    if (this.$reties <= 0) {
      return this._finish(new Error('to many reties failed!'));
    }

    if (!this.$pullable) {
      return this._finish(new Error('no pullable object!'));
    }

    if (this.isState(FINISHED)) {
      console.log('running finish=', this.$running, this.$state);
      return;
    }


    const self = this;
    try {
      if (this.$queue.length === 0 || this.$min_flush_queue > this.$queue.length) {

        self.hasNext()
          .then(function(has_next) {

            if (has_next) {
              self.$fetching++;
              return self
                .fetch()
                .then(function(res) {
                  if (res) {
                    return self.enqueue(res);
                  }
                  return null;
                })
                .then(function() {
                  self.$fetching--;
                  self.$reties = 5;
                  self._next();
                })
                .catch(function(err) {
                  self.$fetching--;
                  self.$reties--;
                  Log.error('retries=' + self.$reties);
                  Log.error(err);
                  setTimeout(function() {
                    self._next();
                  }, self.$error_timeout);
                });
            } else if (self.$queue.length > 0) {
              return self._data();
            } else if (
              self.$queue.length === 0 &&
              self.$enqueued === self.$processed
            ) {
              return self._finish();
            } else {
              Log.error('should not happen');
            }
          });

      } else if (this.$queue.length > 0) {
        if (this.$min_flush_queue > 1) {
          if (this.$min_flush_queue <= this.$queue.length) {
            self._data();
          } else {
            self._next();
          }
        } else {
          self._data();
        }
      } else if (this.$fetching > 0) {
        self._data();
      } else {
        self._finish();
      }
    } catch (err) {
      Log.error(err);
      self._finish(err);
    }
  }


  onFinish(done: Function = null): void | Promise<any> {
    const self = this;
    if (done) {
      this.once('finished', (err, res) => {
        done(err, res);
      });
    } else {
      return new Promise((res, rej) => {
        self.once('finished', (err, _res) => {
          if (err) {
            rej(err);
          } else {
            res(_res);
          }
        });
      });
    }
  }

}

