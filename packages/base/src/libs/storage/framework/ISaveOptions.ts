import { IRequestOptions } from './IRequestOptions';

export interface ISaveOptions extends IRequestOptions {
  validate?: boolean;
  raw?: boolean;
  noTransaction?: boolean;
  skipBuild?: boolean;
}
