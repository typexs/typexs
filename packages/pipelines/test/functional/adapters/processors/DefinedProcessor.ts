import {Processor} from '../../../../src/lib/Processor';

export class DefinedProcessor extends Processor {
  async doProcess(x: any) {
    x.processed = 1234;
    return x;
  }

}
