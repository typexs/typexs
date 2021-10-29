import { IBootstrap, Injector, IShutdown } from '@typexs/base';
import { IndexProcessingQueue } from './lib/events/IndexProcessingQueue';

/**
 * Module activator for @typexs/search
 */
export class Startup implements IBootstrap, IShutdown {


  async bootstrap() {
    // if not disable User Local handle
    const eventDispatcher = Injector.get(IndexProcessingQueue);
    await eventDispatcher.prepare();
  }

  async shutdown() {
    const eventDispatcher = Injector.get(IndexProcessingQueue);
    await eventDispatcher.shutdown();
  }
}
