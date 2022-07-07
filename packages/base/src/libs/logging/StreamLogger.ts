import { ILoggerApi } from './ILoggerApi';
import { ILoggerOptions } from './ILoggerOptions';
import { ILogLevel } from '@allgemein/base';
import { ILogEntry } from './ILogEntry';
import { EventEmitter } from 'events';
import { LOG_EVENT_NAME } from './Constants';

export interface IStreamLoggerOptions extends ILoggerOptions {
  // writeStream: Writable;
  // readStream: Readable;
  emitter: EventEmitter;
}

export class StreamLogger implements ILoggerApi {

  name: string;

  // writeStream: Writable;

  // readStream: Readable;

  options: IStreamLoggerOptions;

  constructor(name: string, opts?: IStreamLoggerOptions) {
    this.name = name;
    this.options = opts;
    // if (!opts.readStream || !(opts.readStream instanceof Readable)) {
    //   throw new Error('no stream passed');
    // }
    // this.readStream = opts.readStream;
  }

  clear(): void {
  }

  close(): void {
    // this.readStream = null;
  }


  getLevel(): ILogLevel {
    return { name: this.getOptions().level, nr: null };
  }


  setLevel(level: string): void {
    this.getOptions().level = level;
  }


  getOptions(): ILoggerOptions {
    return this.options;
  }


  isEnabled(set?: boolean): boolean {
    return this.getOptions().enable;
  }

  remove(): void {
  }

  /**
   * Generic log method putting log data to stream
   *
   * TODO error function for write
   *
   * @param level
   * @param msg
   */
  log(level: number | string, ...msg: any[]): void {
    const event: ILogEntry = {
      level: level,
      args: msg,
      time: new Date(),
      prefix: this.getOptions().prefix,
      parameters: this.getOptions().parameters
    };
    this.getEmitter().emit(LOG_EVENT_NAME, event);
  }

  getEmitter() {
    return this.options.emitter;
  }

  trace(...msg: any[]): void {
    this.log('trace', ...msg);
  }

  debug(...msg: any[]): void {
    this.log('debug', ...msg);
  }

  info(...msg: any[]): void {
    this.log('info', ...msg);
  }

  error(...msg: any[]): void {
    this.log('error', ...msg);
  }

  warn(...msg: any[]): void {
    this.log('warn', ...msg);
  }

  build(name: string, options: ILoggerOptions, append?: boolean): ILoggerApi {
    return undefined;
  }

}
