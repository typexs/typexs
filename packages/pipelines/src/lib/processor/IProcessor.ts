import { PipeHandle } from '../pipeline/PipeHandle';

export interface IProcessor {

  prepare(): any;

  process(data: any): any;

  finish(): any;

  collect(): any;

  setPipeHandle(p: PipeHandle): void;
}
