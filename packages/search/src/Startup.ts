import { IBootstrap, IShutdown, Inject } from '@typexs/base';
import { IndexProcessingQueue } from './lib/IndexProcessingQueue';

/**
 * Module activator for @typexs/search
 */
export class Startup implements IBootstrap, IShutdown {

  @Inject(IndexProcessingQueue.NAME)
  eventDispatcher: IndexProcessingQueue;

  async bootstrap() {
    // if not disable User Local handle
    await this.eventDispatcher.prepare();
  }

  async shutdown() {
    await this.eventDispatcher.shutdown();
  }
}
