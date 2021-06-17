import {defaults} from 'lodash';
import {ILogLevel} from '@allgemein/base';
import {ILoggerOptions} from './ILoggerOptions';


export type LOGLEVEL = 'trace' | 'debug' | 'info' | 'warn' | 'error';

let level = 0;
export const LOGLEVELS: ILogLevel[] =
  [
    {name: 'trace', nr: level++},
    {name: 'debug', nr: level++},
    {name: 'info', nr: level++},
    {name: 'warn', nr: level++},
    {name: 'error', nr: level++},
  ];


export class Log {


  static getOptions() {
    let data: ILoggerOptions = null;
    try {
      data = JSON.parse(localStorage.getItem('txs.log'));
    } catch (e) {
    }

    if (!data) {
      data = {} as any;
    }
    defaults(data, {enable: false, level: 'warn'});
    return data;
  }

  static initialize() {
    const data = this.getOptions();
    this.setOptions(data);


  }

  static setOptions(data: ILoggerOptions) {
    localStorage.setItem('txs.log', JSON.stringify(data));
    if (data.enable) {
      const _entry = LOGLEVELS.find(x => x.name === data.level);

      for (const entry of LOGLEVELS) {
        if (entry.nr >= _entry.nr) {
          if (['trace', 'debug', 'info'].includes(entry.name)) {
            Log[entry.name] = console.log.bind(console);
          } else {
            Log[entry.name] = console[entry.name].bind(console);
          }

        } else {
          Log[entry.name] = () => {
          };
        }
      }
    } else {
      for (const entry of LOGLEVELS) {
        Log[entry.name] = () => {
        };
      }

    }


  }

  static info(...msg: any[]) {
  }

  static trace(...msg: any[]) {
  }

  static debug(...msg: any[]) {
  }

  static warn(...msg: any[]) {
  }

  static error(...msg: any[]) {
  }


}
