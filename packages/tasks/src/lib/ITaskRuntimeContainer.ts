import { ILoggerApi } from '@allgemein/logging';
import { TaskState } from './TaskState';
import { Counter } from '@typexs/base';

export interface ITaskRuntimeContainer {

  runnerId: string;

  taskNr: number;

  name: string;

  logger?(): ILoggerApi;

  progress?(progress: number): void;

  total?(total: number): void;

  /**
   * Dynamically append a new task to runtime
   *
   * @param name
   * @param incomings
   */
  addTask(name: string, incomings?: any): Promise<TaskState>;


  /**
   * Get counters entry for increase/decrease some value
   * @param key
   */
  counter(key: string): Counter;


  /**
   * Return all declared incoming parameter for this task
   */
  getIncomings(): any;

  /**
   * Return all incoming parameter passed to the task runner
   */
  getIncomingsOfRunner(): any;

  /**
   * Return all declared outgoing parameter for this task
   */
  getOutgoings(): any;

  /**
   * Return all undeclared incoming parameter names for this task
   */
  getUndeclaredIncomingNames(): string[];

}
