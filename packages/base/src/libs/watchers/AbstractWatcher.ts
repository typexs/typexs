//
// import {EventBus, IEventDef} from '@allgemein/eventbus';
// import EventBusMeta from '@allgemein/eventbus/bus/EventBusMeta';
// import {FSWatcher} from 'fs';
// // import {TasksHelper} from '../../../../tasks/src/lib/TasksHelper';
// import {AbstractWatcherConfig} from './AbstractWatcherConfig';
// import {hasEvent, hasTask, isWatcherConfig} from './WatcherConfig';
// import {InvalidWatcherConfig} from './WatcherErrors';
// import { assign, isArray, isEmpty, isUndefined } from 'lodash';
//
// /**
//  * An abstract watcher
//  */
// export abstract class AbstractWatcher {
//   /**
//    * Event to be emitted
//    */
//   protected readonly eventDef: IEventDef;
//
//   /**
//    * Name of the watcher
//    */
//   protected readonly name: string;
//
//   /**
//    * List of tasks
//    */
//   protected readonly taskNames: string[] = [];
//
//   /**
//    * Parameters for tasks
//    */
//   protected readonly taskParams: any = {};
//
//   /**
//    * Instance of FSWatcher
//    */
//   protected watcher: FSWatcher;
//
//   /**
//    * Whether or not the watcher is valid
//    */
//   abstract isValid(): Promise<boolean>;
//
//   /**
//    * Start the watcher
//    */
//   abstract start(): Promise<void>;
//
//   /**
//    * Stop the watcher
//    */
//   abstract stop(): Promise<void>;
//
//   /**
//    * Create a new abstract watcher
//    *
//    * @param config Watcher config
//    */
//   protected constructor(config: AbstractWatcherConfig) {
//     this.name = config.name;
//
//     if (!isWatcherConfig(config)) {
//       throw new InvalidWatcherConfig(this.name);
//     }
//
//     if (hasEvent(config)) {
//       this.eventDef = EventBusMeta.$().findEvent(config.event);
//     }
//
//     if (hasTask(config)) {
//       this.taskNames = config.task.names;
//       this.taskParams = config.task.params;
//     }
//   }
//
//   /**
//    * Emit an event
//    *
//    * @param params
//    */
//   protected async emitEvent(params: any) {
//     if (this.eventDef === undefined) {
//       return;
//     }
//
//     const instance = Reflect.construct(this.eventDef.clazz, []);
//     assign(instance, {
//       $watcher: params,
//     });
//
//     return EventBus.postAndForget(instance);
//   }
//
//   /**
//    * Execute tasks
//    */
//   protected async executeTasks(params: any) {
//     if (isArray(this.taskNames) && !isEmpty(this.taskNames)) {
//       await TasksHelper.exec(this.taskNames, {
//         ...this.taskParams,
//         $watcher: params,
//         skipTargetCheck: false
//       });
//     }
//   }
// }
