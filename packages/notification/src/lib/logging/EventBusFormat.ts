import {EventBus} from '@allgemein/eventbus';


export class EventBusFormat {

  transform(info: any, opts = {}) {
    const now = Date.now();

    //  EventBus.post(info.event);
    /*
    info['timestamp'] = now;
    info['options'] = opts;
    const prefix = [Log_1.Log.prefix ? Log_1.Log.prefix : ''];
    if (info['event'] && info['event'] instanceof LogEvent_1.LogEvent) {
      if (info['event'].prefix) {
        prefix.push(info['event'].prefix);
      }
    }
    info['prefix'] = prefix.filter(x => !isEmpty(x)).join(':');
    // Return string will be passed to logger.
    info[triple_beam_1.MESSAGE] = stringify.default(info, opts.replacer || replacer, opts.space);
    return info;

     */
    return info;
  }

}
