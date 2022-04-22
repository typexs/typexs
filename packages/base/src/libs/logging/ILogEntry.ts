import {isArray} from 'lodash';

export interface ILogEntry {
  level?: string | number;
  message?: string;
  args?: any[];
  time?: Date;
  [k: string]: any;
}

export function isLogEntry(x: any): x is ILogEntry {
  const y = x as ILogEntry;
  return y?.level && y?.args && isArray(y.args);
}
