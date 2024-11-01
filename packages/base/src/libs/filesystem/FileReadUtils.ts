import * as fs from 'fs';
import { Stats } from 'fs';
import { IFileStat } from './IFileStat';
import { STATS_METHODS } from './Constants';
import { createInterface } from 'readline';


export class FileReadUtils {


  static async stat(filepath: string): Promise<Stats> {
    return new Promise((resolve, reject) => fs.stat(filepath, (err: Error, res: Stats) => err ? reject(err) : resolve(res)));
  }

  static async open(filepath: string): Promise<number> {
    return new Promise((resolve, reject) => fs.open(filepath, 'r', (err: Error, res: number) => err ? reject(err) : resolve(res)));
  }

  static async statInfo(filepath: string): Promise<IFileStat> {
    const stats: IFileStat = {};
    const _stats = await this.stat(filepath);
    for (const statKey of Object.keys(_stats)) {
      stats[statKey] = _stats[statKey];
    }
    STATS_METHODS.forEach(method => {
      stats[method] = _stats[method]();
    });
    return stats;
  }

  static async tail(filepath: string, maxlines: number = -1, encoding: BufferEncoding = 'utf8') {
    let stat: Stats = null;
    let file: number = null;
    const NEW_LINE_CHARACTERS = ['\n', '\r'];

    const readPreviousChar = (stat: Stats, file: number, currentCharacterCount: number) => new Promise((resolve, reject) => {
      fs.read(file, Buffer.alloc(1), 0, 1, stat.size - 1 - currentCharacterCount, (err: Error, bytesRead: number, buffer: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer.toString());
        }
      });
    });

    if (!fs.existsSync(filepath)) {
      throw new Error('file does not exist');
    }

    stat = await new Promise((resolve, reject) => fs.stat(filepath, (err: Error, res: Stats) => err ? reject(err) : resolve(res)));
    file = await new Promise((resolve, reject) => fs.open(filepath, 'r', (err: Error, res: number) => err ? reject(err) : resolve(res)));

    let chars = 0;
    let lineCount = 0;
    let lines = '';

    const do_while_loop = async (): Promise<Buffer | string> => {
      if (lines.length > stat.size) {
        lines = lines.substring(lines.length - stat.size);
      }

      if (lines.length >= stat.size || (lineCount >= maxlines && maxlines >= 0)) {
        if (NEW_LINE_CHARACTERS.includes(lines.substring(0, 1))) {
          lines = lines.substring(1);
        }
        await new Promise((resolve, reject) => fs.close(file, err => err ? reject(err) : resolve(null)));
        if (encoding === 'binary') {
          return Buffer.from(lines, 'binary');
        }
        return Buffer.from(lines, 'binary').toString(encoding);
      }

      return readPreviousChar(stat, file, chars)
        .then((nextCharacter: string) => {
          lines = nextCharacter + lines;
          if (NEW_LINE_CHARACTERS.includes(nextCharacter) && lines.length > 1) {
            lineCount++;
          }
          chars++;
        })
        .then(do_while_loop);
    };

    return do_while_loop();

  }

  static async less(filepath: string, from: number = 0, maxlines: number = -1, encoding: BufferEncoding = 'utf8') {
    if (!fs.existsSync(filepath)) {
      throw new Error('file does not exist');
    }
    maxlines = maxlines <= 0 ? 10000 : maxlines;
    let out = '';
    const rl = createInterface({
      input: fs.createReadStream(filepath)
    });
    let cntr = 0;
    let takeLineCntr = 0;
    for await (let line of rl) {
      if (typeof line === 'string') {
        if (cntr++ >= from) {
          if (cntr > from + 1) {
            out += '\n';
          }
          out += line;
          if (takeLineCntr++ >= maxlines - 1) {
            break;
          }
        }
      } else {
        break;
      }
    }
    rl.close();
    return out;
  }

  // static async _less(filepath: string, from: number = 0, maxlines: number = -1, encoding: BufferEncoding = 'utf8') {
  //   let stat: Stats = null;
  //   let file: number = null;
  //   const NEW_LINE_CHARACTERS = ['\n', '\r'];
  //
  //   const readChar = (stat: Stats, file: number, currentCharacterCount: number) => new Promise((resolve, reject) => {
  //     fs.read(file, Buffer.alloc(1), 0, 1, currentCharacterCount, (err: Error, bytesRead: number, buffer: Buffer) => {
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(buffer.toString());
  //       }
  //     });
  //   });
  //
  //   if (!fs.existsSync(filepath)) {
  //     throw new Error('file does not exist');
  //   }
  //
  //   stat = await new Promise((resolve, reject) => fs.stat(filepath, (err: Error, res: Stats) => err ? reject(err) : resolve(res)));
  //   file = await new Promise((resolve, reject) => fs.open(filepath, 'r', (err: Error, res: number) => err ? reject(err) : resolve(res)));
  //
  //   let started = false;
  //   let chars = 0;
  //   let lineCount = 0;
  //   let lineSelectedCount = 0;
  //   let lines = '';
  //
  //   // set default lines
  //   maxlines = maxlines === 0 ? 10000 : maxlines;
  //
  //   const do_while_loop = async (): Promise<Buffer | string> => {
  //     if ((!started && lines.length > 0) || chars >= stat.size) {
  //       await new Promise((resolve, reject) => fs.close(file, err => err ? reject(err) : resolve(null)));
  //       lines = lines.substring(0, lines.length - 1);
  //       if (encoding === 'binary') {
  //         return Buffer.from(lines, 'binary');
  //       }
  //       return Buffer.from(lines, 'binary').toString(encoding);
  //     }
  //
  //     return readChar(stat, file, chars)
  //       .then((nextCharacter: string) => {
  //         if (lineCount >= from && (lineSelectedCount < maxlines)) {
  //           started = true;
  //         } else {
  //           started = false;
  //         }
  //         if (NEW_LINE_CHARACTERS.includes(nextCharacter)) {
  //           lineCount++;
  //           if (started) {
  //             lineSelectedCount++;
  //           }
  //         }
  //         if (started) {
  //           lines = lines + nextCharacter;
  //         }
  //         chars++;
  //       })
  //       .then(do_while_loop);
  //   };
  //
  //   return do_while_loop();
  // }


  static async readByByte(filepath: string, from: number = 0, length: number = 0) {
    const file = await this.open(filepath);
    const stat = await this.stat(filepath);
    if (!length) {
      length = stat.size - from;
    } else {
      if (from + length > stat.size) {
        length = stat.size - from;
      }
    }

    const buffer = Buffer.alloc(length);
    return new Promise((resolve, reject) => {
      fs.read(file, buffer, 0, 100, 0, (err, num) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

}
