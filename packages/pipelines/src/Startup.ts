import {IBootstrap, Inject, Injector, IRuntimeLoader, RuntimeLoader} from '@typexs/base';
import {PipelineRegistry} from './lib/PipelineRegistry';

export class Startup implements IBootstrap {

  @Inject(RuntimeLoader.NAME)
  loader: IRuntimeLoader;

  async bootstrap() {
    const p: PipelineRegistry = Injector.get(PipelineRegistry.NAME);
    await p.load(this.loader);

  }
}
