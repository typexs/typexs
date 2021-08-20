import {assign, get, has, isNull, isString} from 'lodash';
import TransportStream from 'winston-transport';
import {LogEvent} from '@typexs/base';
import EventBusMeta from 'commons-eventbus/bus/EventBusMeta';
import {EventBus} from 'commons-eventbus';
import {IEventBusTransportStreamOptions} from './IEventBusTransportStreamOptions';
import {LOG_LEVELS} from './Constants';


export class EventBusTransportStream extends TransportStream {
  eventName: string;
  eventClass: Function;
  __options: IEventBusTransportStreamOptions;

  constructor(options: IEventBusTransportStreamOptions) {
    super(options);
    this.__options = options;
    const ebm = EventBusMeta.$();
    const meta = ebm.findEvent(options.event);
    if (!meta) {
      throw new Error('event not found');
    }

    this.eventName = options.event;
    this.eventClass = meta.clazz;
  }


  log(info: any, callback: () => void) {
    if (get(this.__options, 'silent', false) && callback) {
      callback();
      return;
    }

    setImmediate(() => this.emit('logged', info));
    const level = get(info, 'level', null);
    if (has(info, 'event') && info.event instanceof LogEvent) {
      let fire = false;
      if (this.__options.level && level) {
        const l1 = get(LOG_LEVELS, this.__options.level, null);
        const l2 = get(LOG_LEVELS, level, null);
        fire = !isNull(l1) && !isNull(l2) && l1 <= l2;
      } else {
        fire = true;
      }

      if (fire) {
        const event: any = Reflect.construct(this.eventClass, []);
        event.timestamp = Date.now();
        event.level = level;
        if (this.__options.params) {
          event.params = this.__options.params;
        }
        assign(event, info.event);
        if (event.args) {
          for (const arg of event.args) {
            if (!event.message) {
              if (arg instanceof Error) {
                event.message = arg.message + '';
                event.stack = arg.stack + '';
              } else if (isString(arg)) {
                event.message = arg + '';
                event.stack = null;
              }
            }
          }
        }
        setImmediate(() => EventBus.postAndForget(event));
      }
    }

    if (callback) {
      callback();
    }

  }
}
