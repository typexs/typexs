import { ILogLevel } from '@allgemein/logging';
import { ILoggerApi } from '@typexs/base';
import { ILoggerOptions } from '@typexs/base';

export class TaskRuntimeLogger implements ILoggerApi {

  name: string;

  private taskId: string;

  private taskName: string;

  private taskNr: number;

  private baseLogger: ILoggerApi;

  constructor(taskId: string,
    taskName: string,
    taskNr: number,
    baseLogger: ILoggerApi) {
    this.taskId = taskId;
    this.taskName = taskName;
    this.taskNr = taskNr;
    this.baseLogger = baseLogger;
    this.name = [this.taskId, this.taskNr, this.taskName].join(':');
  }


  log(level: string, ...msg: any[]): void {
    this.baseLogger.log(level, ...msg);
  }


  info(...msg: any[]): void {
    this.log('info', ...msg);
  }

  debug(...msg: any[]): void {
    this.log('debug', ...msg);
  }

  error(...msg: any[]): void {
    this.log('error', ...msg);
  }


  trace(...msg: any[]): void {
    this.log('trace', ...msg);
  }

  warn(...msg: any[]): void {
    this.log('warn', ...msg);
  }


  getLevel(): ILogLevel {
    return this.baseLogger.getLevel();
  }


  isEnabled(set?: boolean): boolean {
    return this.baseLogger.isEnabled();
  }

  setLevel(level: number | string): void {
  }

  clear(): void {
    // return this.baseLogger.clear();
  }

  close(): void {
    // return this.baseLogger.clear();
  }

  getOptions(): ILoggerOptions {
    return undefined;
  }


  remove() {

  }


  getBaseLogger() {
    return this.baseLogger;
  }

}
