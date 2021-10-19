import {IActivator, Injector} from '@typexs/base';
import {PipelineRegistry} from './lib/PipelineRegistry';

export class Activator implements IActivator {


  async startup() {
    Injector.set(PipelineRegistry.NAME, Injector.get(PipelineRegistry));
  }

}
