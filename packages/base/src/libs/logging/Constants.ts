import {ILoggerOptions} from './ILoggerOptions';
import {ConsoleTransportOptions} from 'winston/lib/winston/transports';

export const LOG_EVENT_NAME = 'log_event';

export const DEFAULT_LOGGER_OPTIONS: ILoggerOptions = {
  enable: true,

  level: 'info',

  transports: [
    {
      console: <ConsoleTransportOptions>{
        name: 'console',
        // stderrLevels: [],
        timestamp: true,
        json: false,

      }
    }
  ]
};
