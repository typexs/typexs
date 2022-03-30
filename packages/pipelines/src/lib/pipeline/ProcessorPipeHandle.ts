import { PipeHandle } from './PipeHandle';
import { IPipeline } from './IPipeline';
import { IProcessor } from '../processor/IProcessor';

export class ProcessorPipeHandle extends PipeHandle {
  _processor: IProcessor;

  constructor(PL: IPipeline, proc: IProcessor) {
    super(PL);
    this._processor = proc;
    proc.setPipeHandle(this);
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
