import { AbstractSchemaHandler } from '../../../libs/storage/AbstractSchemaHandler';
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { NotYetImplementedError } from '@allgemein/base';
import { isRegExp, isString, map } from '@typexs/generic';


export class MysqlSchemaHandler extends AbstractSchemaHandler {

  type: string = 'mysql';

  initOnceByType() {
    super.initOnceByType();

    const fn = {
      regex: (k: string, field: string | RegExp, options: string) => {
        if (isString(field)) {
          return k + ' REGEXP ' + field;
        } else if (isRegExp(field)) {
          return k + ' REGEXP ' + field.source;
        } else {
          throw new NotYetImplementedError('regex for ' + k + ' with value ' + field);
        }

      },
      date: (field: string) => 'DATE_FORMAT(' + field + ',\'%Y-%m-%d\')',
      dateToString:
        (field: string, format: string = '%Y-%m-%d %H:%M:%S' /* +, timezone: any, onNull: any */) =>
          'strftime(\'' + format + '\', ' + field + ')',
    };

     Object.keys(fn).forEach(x => {
      this.registerOperationHandle(x, fn[x]);
    });

  }


  async getCollectionNames(): Promise<string[]> {
    const c = await this.storageRef.connect();
    const database = (<MysqlConnectionOptions>this.storageRef.getOptions()).database;
    const q = await c.query('SELECT table_name FROM information_schema.tables WHERE table_schema=\'' + database + '\';');
    return map(q, x => x.table_name);
  }



  resolveTypeToStorage(sourceType: string, opts: { variant?: string; length?: number; [k: string]: any } = null) {
    let type = null;
    switch (sourceType) {
      case 'string':
        type = 'varchar';
        // if (opts && opts.length && opts.length > 0) {
        //   type = 'varchar';
        // }
        break;
      case 'text':
        type = 'text';
        break;
      case 'boolean':
        type = 'boolean';
        break;
      case 'number':
        type = 'int';
        break;
      case 'bigint':
      case 'bignumber':
        type = 'bigint';
        break;
      case 'double':
      case 'float':
        type = 'double';
        break;
      case 'time':
        type = 'time';
        break;
      case 'date':
        type = 'date';
        if (opts && opts.variant) {
          type = 'datetime';
        }
        break;
      case 'datetime':
        type = 'datetime';
        break;
      case 'timestamp':
        type = 'timestamp';
        break;
      // case 'object':
      // case 'array':
      case 'json':
        type = 'json';
        break;

    }
    return type;
  }


}
