import {IBootstrap, IShutdown} from '@typexs/base';

/**
 * Module activator for @typexs/search
 */
export class Startup implements IBootstrap, IShutdown {


  async bootstrap() {
    // TODO check if active
    // TODO check if worker online
    // if not disable User Local handle
    // const eventDispatcher = Injector.get(IndexProcessingQueue);
    // await eventDispatcher.prepare();
  }

  async shutdown() {
    // const eventDispatcher = Injector.get(IndexProcessingQueue);
    // await eventDispatcher.shutdown();
  }
}
