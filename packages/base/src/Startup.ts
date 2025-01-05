import { isArray } from 'lodash';
import { Config } from '@allgemein/config';
import { EventBus, IEventBusConfiguration } from '@allgemein/eventbus';
import { Inject } from 'typedi';
import { IBootstrap } from './api/IBootstrap';
import { IShutdown } from './api/IShutdown';
import { RuntimeLoader } from './base/RuntimeLoader';
import { Cache } from './libs/cache/Cache';
import { ICacheConfig } from './libs/cache/ICacheConfig';
import {
  C_CONFIG,
  C_EVENTBUS,
  C_KEY_SEPARATOR,
  K_CLS_CACHE_ADAPTER,
  K_CLS_EVENTBUS_ADAPTER,
  K_CLS_EXCHANGE_MESSAGE,
  K_CLS_SCHEDULE_ADAPTER_FACTORIES
} from './libs/Constants';
import { Log } from './libs/logging/Log';
import { IScheduleDef } from './libs/schedule/IScheduleDef';
import { Scheduler } from './libs/schedule/Scheduler';
import { System } from './libs/system/System';
// import { WatcherRegistry } from './libs/watchers/WatcherRegistry';
import { Workers } from './libs/worker/Workers';
import { ExchangeMessageRegistry } from './libs/messaging/ExchangeMessageRegistry';
import { ConfigUtils } from './libs/utils/ConfigUtils';
import { Injector } from './libs/di/Injector';
import { ClassUtils } from '@allgemein/base';


export class Startup implements IBootstrap, IShutdown {

  // @Inject(Tasks.NAME)
  // tasks: Tasks;
  //
  // @Inject(TaskRunnerRegistry.NAME)
  // taskRunnerRegistry: TaskRunnerRegistry;

  @Inject(Cache.NAME)
  cache: Cache;

  @Inject(RuntimeLoader.NAME)
  loader: RuntimeLoader;

  @Inject(System.NAME)
  system: System;

  @Inject(ExchangeMessageRegistry.NAME)
  exchangeMessages: ExchangeMessageRegistry;

  @Inject(Workers.NAME)
  workers: Workers;

  // @Inject(WatcherRegistry.NAME)
  // watcherRegistry: WatcherRegistry;


  private async schedule() {
    const scheduler: Scheduler = Injector.get(Scheduler.NAME);
    await scheduler.prepare(this.loader.getClasses(K_CLS_SCHEDULE_ADAPTER_FACTORIES).map(x => Injector.get(x)));
    const schedules: IScheduleDef[] = Config.get('schedules', []);
    if (isArray(schedules)) {
      for (const s of schedules) {
        await scheduler.register(s);
      }
    }
  }

  private eventbus() {
    const bus: { [name: string]: IEventBusConfiguration } = Config.get(C_EVENTBUS, false);
    if (bus) {
      Log.debug('initialize eventbus');
      const classes = this.loader.getClasses(K_CLS_EVENTBUS_ADAPTER);
      classes.map(x => EventBus.registerAdapter(x));
      for (const name of Object.keys(bus)) {
        const busCfg: IEventBusConfiguration = bus[name];
        busCfg.name = name;
        Log.debug('eventbus: ' + name + ' of class ' + ClassUtils.getClassName(busCfg.adapter));
        const x = EventBus.$().addConfiguration(busCfg);
      }
    }
  }

  async bootstrap(): Promise<void> {
    /**
     * Initialize bus first
     */
    this.eventbus();

    await this.workers.onStartup(this.loader);


    const cacheAdapters = this.loader.getClasses(K_CLS_CACHE_ADAPTER);
    if (cacheAdapters.length > 0) {
      Log.debug('initialize cache adapter');
      for (const cls of cacheAdapters) {
        Log.debug('cache adapter class ' + ClassUtils.getClassName(cls));
        await this.cache.register(<any>cls);
      }
    }

    const cache: ICacheConfig = Config.get('cache', {});
    await this.cache.configure(this.system.node.nodeId, cache);
    // TODO waiting for this promise causes unknown halt in an additionally spawned node
    this.cache.set([C_CONFIG, this.system.node.nodeId].join(C_KEY_SEPARATOR), ConfigUtils.clone());

    for (const cls of this.loader.getClasses(K_CLS_EXCHANGE_MESSAGE)) {
      await this.exchangeMessages.addExchangeMessage(<any>cls);
    }
  }


  async ready() {
    await this.workers.startup();

    // TODO start schedules only on a worker node!
    await this.schedule();

    if (System.isDistributionEnabled()) {
      await this.system.register();
      const wait = Config.get('nodes.ready.wait', 500);
      if (wait > 0) {
        Log.debug('wait for node registration feedback ...');
        await new Promise((resolve => {
          setTimeout(resolve, wait);
        }));
      }
    } else {
      await this.system.idle();
    }
  }

  /**
   * impl. onShutdown function, shutdowns following components:
   * - cache
   * - distributed system
   * - EventBus
   * - tasks
   * - workers
   * - watchers
   */
  async shutdown() {
    // await this.taskRunnerRegistry.onShutdown();
    const nodes = this.system
      .getAllNodes()
      .filter(x => x.nodeId === this.system.node.nodeId);

    if (nodes.length > 0) {
      // remove if no node exists
      await this.cache.set([C_CONFIG, this.system.node.nodeId].join(C_KEY_SEPARATOR), null);
    }

    await this.cache.shutdown();
    if (System.isDistributionEnabled()) {
      await this.system.unregister();
    } else {
      await this.system.offline();
    }
    await EventBus.$().shutdown();
    // this.tasks.reset();
    await this.workers.shutdown();
    // await this.watcherRegistry.stopAll();

  }

}
