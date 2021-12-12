import { ILoggerApi } from '@allgemein/base';
import * as buffer from 'buffer';

export interface IServerOptions {

  // url?: string

  protocol?: string;

  ip?: string;

  port?: number;

  fn?: string;

  stall?: number;

  cert_file?: string;

  cert?: string | any;

  key_file?: string;

  key?: string | any;

  ca_file?: string;

  ca?: string | any;

  ca_key_file?: string;

  ca_key?: string | any;

  strictSSL?: boolean;

  timeout?: number;

  _debug?: boolean;

  /**
   * Inject a logger
   */
  logger?: ILoggerApi;
}


export const DEFAULT_SERVER_OPTIONS: IServerOptions = {

  protocol: 'http',

  ip: '127.0.0.1',

  port: 3554,

  fn: 'root',

  stall: 0,

  timeout: 60000,

  _debug: false
};
