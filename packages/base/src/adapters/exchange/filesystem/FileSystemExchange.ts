import { get, isEmpty, isString, isUndefined } from '@typexs/generic';
import * as fs from 'fs';
import { join, resolve } from 'path';
import { FileUtils, Glob } from '@allgemein/base';
import { AbstractExchange } from '../../../libs/messaging/AbstractExchange';
import { FileSystemRequest } from './FileSystemRequest';
import { FileSystemResponse } from './FileSystemResponse';
import { IFileOptions } from './IFileOptions';
import { FileReadUtils } from '../../../libs/filesystem/FileReadUtils';
import { Config } from '@allgemein/config';
import { CFG_KEY_APP_PATH, CFG_KEY_FILESYSTEM } from '../../../libs/filesystem/Constants';
import { IFileSystemConfig } from '../../../libs/filesystem/IFileSystemConfig';
import { MatchUtils } from '../../../libs/utils/MatchUtils';


export class FileSystemExchange extends AbstractExchange<FileSystemRequest, FileSystemResponse> {

  config: IFileSystemConfig = {};

  basePath: string;

  allowedPaths: { path: string, match: boolean }[] = [];


  constructor() {
    super(FileSystemRequest, FileSystemResponse);
  }

  /**
   * using onStartup to declare accessible system paths
   */
  async prepare() {
    this.basePath = resolve(Config.get(CFG_KEY_APP_PATH, '.'));
    this.config = Config.get(CFG_KEY_FILESYSTEM, {}) as IFileSystemConfig;
    if (this.config.paths) {

      this.allowedPaths = this.config.paths
        .map(
          x => isString(x) && !isEmpty(x) ?
            // todo check blob
            resolve(this.basePath, x) : null
        )
        .filter(x => !isEmpty(x))
        .map(x => {
          return {
            path: x,
            match: MatchUtils.isGlobPattern(x)
          };
        });

    } else {
      this.logger.warn('message handler [file system exchange]: no accessible paths defined, no declaration of filesystem.paths in config');
    }

    await super.prepare();
  }


  async file(opts: IFileOptions): Promise<any[]> {
    const r = new FileSystemRequest(opts);
    const msg = this.create(opts);
    return await msg.send(r);
  }


  async handleRequestRead(request: FileSystemRequest, res: FileSystemResponse) {
    const opts = request.options;
    const path = opts.path;

    let unit: 'byte' | 'line' = 'byte';
    if (!isUndefined(opts.unit)) {
      unit = opts.unit;
    }

    if (isUndefined(opts.limit) && isUndefined(opts.offset) && isUndefined(opts.tail)) {
      res.data = await FileUtils.readFile(path);
    } else if (!isUndefined(opts.tail)) {
      res.data = await FileReadUtils.tail(path, opts.tail ? opts.tail : 50);
    } else if (!isUndefined(opts.limit) || !isUndefined(opts.offset)) {
      if (unit === 'line') {
        res.data = await FileReadUtils.less(path, opts.offset ? opts.offset : 0, opts.limit ? opts.limit : 0);
      } else {
        res.data = await FileReadUtils.readByByte(path, opts.offset ? opts.offset : 0, opts.limit ? opts.limit : 0);
      }
    } else {
      throw new Error(`combination of options is ambivalent`);
    }
  }


  async handleRequestList(request: FileSystemRequest, res: FileSystemResponse) {
    const opts = request.options;
    const path = opts.path;

    if (!isUndefined(opts.glob) && opts.glob) {
      res.data = await Glob.async(path);
    } else {
      res.data = await new Promise((resolve, reject) => {
        fs.readdir(path, (err, files) => {
          if (err) {
            reject(err);
          } else {
            resolve(files);
          }
        });
      });
    }

    if (!isUndefined(opts.stats) && opts.stats) {
      res.data = await Promise.all(res.data.map(async (x: string) => {
        return {
          path: x,
          stats: await FileReadUtils.statInfo(join(path, x))
        };
      }));
    }

  }


  async handleRequest(request: FileSystemRequest, res: FileSystemResponse) {
    if (isEmpty(this.allowedPaths)) {
      res.error = new Error('access to path not allowed [0]');
      return;
    }
    res.options = request.options;
    if (isEmpty(request) || isEmpty(get(request, 'options.path', null))) {
      res.error = new Error('no path in request');
      return;
    }

    const opts = request.options;
    const path = resolve(this.basePath, opts.path);
    request.options.path = path;

    const allowed = !!this.allowedPaths.find(x => x.match ? MatchUtils.miniMatch(x.path, path) : path.startsWith(x.path));
    if (!allowed) {
      res.error = new Error('access to path not allowed [1]');
      return;
    }

    if (!fs.existsSync(path)) {
      res.error = new Error('file not found');
      return;
    }


    const stats = await FileReadUtils.statInfo(path);
    if (!isUndefined(opts.stats) && opts.stats) {
      res.stats = stats;
    }

    try {
      if (stats.isDirectory) {
        return this.handleRequestList(request, res);
      } else {
        return this.handleRequestRead(request, res);
      }
    } catch (e) {
      res.error = e;
    }
  }


  handleResponse(responses: FileSystemResponse): any {
    let res: any = responses.data;
    if (responses.data) {
      if (responses.data.type && responses.data.type === 'Buffer') {
        res = Buffer.from(responses.data.data);
      } else {
        res = responses.data;
      }

      if (!isUndefined(responses.options.stats) && responses.options.stats && responses.stats.isFile) {
        res = {
          data: res,
          stats: responses.stats
        };
      }
    }
    return res;
  }
}


