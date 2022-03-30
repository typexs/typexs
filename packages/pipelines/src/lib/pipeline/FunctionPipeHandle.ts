import { PipeHandle } from './PipeHandle';
import { IPipeline } from './IPipeline';

export class FunctionPipeHandle extends PipeHandle {

  constructor(PL: IPipeline, fn: Function) {
    super(PL);
    this._function = fn;
  }

  _function: any;

  static createPipePromise(pipe: any, data: any, self: any) {
    return new Promise(function(res, rej) {
      if (pipe.length === 2) {
        pipe.call(self, data, function(err: Error, _res: any) {
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
