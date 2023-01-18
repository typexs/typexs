import { IReader } from './IReader';
import { IReaderOptions } from './IReaderOptions';
import { Pipeline } from '../Pipeline';
import { ILoggerApi, Log } from '@typexs/base';
import { createEmbeddedPromise, PIPE_HANDLER } from './Constants';
import { Processor } from '../Processor';
import { ERROR_FUNCTION } from '../Constants';
import { clone, defaults, get, isArray, isBoolean, isFunction, isNumber, isObjectLike, isString, isUndefined, keys } from 'lodash';
import { ConditionsProvider } from './ConditionsProvider';

export abstract class AbstractReader implements IReader {

  readonly $readerType: string;

  $options: IReaderOptions;

  $pipe: Pipeline;

  $timestamp: any;

  $stats: any;

  logger: ILoggerApi;

  conditionsProvider: ConditionsProvider;


  constructor(type: string, options: IReaderOptions) {
    this.$readerType = type;
    this.$options = defaults(options || {}, { size: 100 });
    this.logger = get(options, 'logger', Log.getLogger());
    this.$timestamp = new Date();
    if (options[PIPE_HANDLER]) {
      if (options[PIPE_HANDLER] instanceof Pipeline) {
        this.$pipe = <any>options[PIPE_HANDLER];
      } else {
        this.$pipe = Reflect.construct(options[PIPE_HANDLER], [options]);
      }
    } else {
      this.$pipe = new Pipeline(options);
    }
    this.$pipe.$src = this;

    this.$stats = {
      began: this.$timestamp,
      finished: this.$timestamp,
      enqueued: 0
    };
  }

  getOptions(): IReaderOptions {
    return this.$options;
  }

  /**
   * Return the conditions if passed as mango query or call function if exists
   *
   * @param options
   */
  async getConditions() {
    const conditions: any = this.getOptions().conditions ? this.getOptions().conditions : null;
    if (isFunction(conditions)) {
      if (conditions.length === 1) {
        return await conditions(this);
      } else {
        return await conditions();
      }
    } else if (isObjectLike(conditions) && conditions instanceof ConditionsProvider) {
      if (!this.conditionsProvider) {
        this.conditionsProvider = conditions;
        this.conditionsProvider.setReader(this);
      }
      return this.conditionsProvider.provide();
    }
    return conditions;
  }

  /**
   * Filter options entries out where values are not of primitive type (pass number, string, boolean)
   */
  getFilteredOptions() {
    const opts = this.getOptions();
    const selectedValues: any = {};
    keys(opts).filter(k => isNumber(opts[k]) || isString(opts[k]) || isBoolean(opts[k])).map(k => selectedValues[k] = clone(opts[k]));
    if (opts?.passOptions && isArray(opts.passOptions)) {
      opts.passOptions.filter(x => isString(x)).map(k => {
        if (!isUndefined(opts[k])) {
          selectedValues[k] = clone(opts[k]);
        }
      });
    }
    return selectedValues;
  }

  /**
   * Collect output data
   */
  async collect() {
    return { stats: this.$stats, pipes: await this.$pipe.collect() };
  }


  /**
   * @deprecated
   *
   * @param pipeline
   * @returns {Reader}
   */
  pipeline(pipeline: any) {
    if (pipeline instanceof Pipeline) {
      this.$pipe = pipeline;
      pipeline.$src = this;
    } else {
      throw new Error('no new pipeline object!');
    }
    return this;
  }


  pipe(pipe: any): IReader {
    if (isFunction(pipe)) {
      this.$pipe.use(pipe);
    } else if (pipe instanceof Processor) {
      this.$pipe.use(pipe);
    } else {
      throw new Error('no pipe compatible object');
    }
    return this as any as IReader;
  }


  onFinish(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.getOptions().finishCallback = resolve;
    });
  }

  onCatch(pipe: ERROR_FUNCTION): IReader {
    // throw new Error('Method not implemented.');
    // this.$pipe.
    this.$pipe.setErrorCallback(pipe);
    return this;
  }

  doRun() {
  }


  init() {
    return createEmbeddedPromise(this, 'doInit');
  }

  fetch() {
    return createEmbeddedPromise(this, 'doFetch');
  }


  doInit(cb: any) {
    cb(null, null);
  }

  doProcess(data: any) {
    if (this.$pipe) {
      return this.$pipe.execute(data);
    } else {
      throw new Error('no pipe or pipeline defined to push data [1]');
    }
  }

  finalize() {
    if (this.getOptions().finishCallback) {
      this.getOptions().finishCallback();
    }
  }


  run(data?: any, finish?: (err: Error, data: any) => void) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return this.init()
      .then(function(res) {
        if (self.$pipe) {
          return self.$pipe.prepare();
        } else {
          throw new Error('no pipe or pipeline defined to push data [3]');
        }
      })
      .then(function() {
        const $p = (<Promise<any>>self.onFinish())
          .then(function(res) {
            if (self.$pipe) {
              return self.$pipe.close();
            } else {
              throw new Error('no pipe or pipeline defined to push data [2]');
            }
          })
          .then(function(res) {
            if (finish) {
              finish(null, { pipes: res, stats: self.$stats });
              return {};
            } else {
              return { pipes: res, stats: self.$stats };
            }
          })
          .catch(function(err) {
            Log.error(err);
            if (finish) {
              finish(err, { pipes: [], stats: self.$stats });
            } else {
              throw err;
            }
          });
        // self.$queue.run();
        self.doRun();
        return $p;
      });
  }


}
