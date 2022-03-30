import { IPipeline } from './IPipeline';


export abstract class PipeHandle {

  _pipeline: IPipeline;
  _handleId: any;
  _initialized: boolean;
  _queue: any[];


  constructor(PL: IPipeline) {
    this._pipeline = PL;
    this._handleId = PL.createHandleId();
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
