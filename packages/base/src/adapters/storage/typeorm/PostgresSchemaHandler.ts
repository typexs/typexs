import { AbstractSchemaHandler } from '../../../libs/storage/AbstractSchemaHandler';

import { NotYetImplementedError } from '@allgemein/base';
import { isRegExp, isString, map } from '@typexs/generic';

export class PostgresSchemaHandler extends AbstractSchemaHandler {

  type: string = 'postgres';


  initOnceByType() {
    super.initOnceByType();
    this.registerOperationHandle('year', (field: string) => 'EXTRACT(YEAR FROM ' + field + ')');
    this.registerOperationHandle('month', (field: string) => 'EXTRACT(MONTH FROM ' + field + ')');
    this.registerOperationHandle('day', (field: string) => 'EXTRACT(DAY FROM ' + field + ')');

    this.registerOperationHandle('timestamp', (field: string) => 'EXTRACT(EPOCH FROM ' + field + ')');


    const fn = {

      year: (field: string) => 'EXTRACT(YEAR FROM ' + field + ')',
      month: (field: string) => 'EXTRACT(MONTH FROM ' + field + ')',
      day: (field: string) => 'EXTRACT(DAY FROM ' + field + ')',

      // sum: (field: string) => 'SUM(' + field + '::bigint)',
      date: (field: string) => 'TO_CHAR(' + field + ', \'YYYY-MM-DD\')',
      timestamp: (field: string) => 'EXTRACT(EPOCH FROM ' + field + ')',
      regex: (k: string, field: string | RegExp, options: string) => {
        if (isString(field)) {
          return k + ' ~ ' + field;
        } else if (isRegExp(field)) {
          return k + ' ~ ' + field.source;
        } else {
          throw new NotYetImplementedError('regex for ' + k + ' with value ' + field);
        }
      },
      dateToString:
        (field: string, format: string = '%Y-%m-%d %H:%M:%S' /* +, timezone: any, onNull: any */) =>
          'strftime(\'' + format + '\', ' + field + ')'
    };

     Object.keys(fn).forEach(x => {
      this.registerOperationHandle(x, fn[x]);
    });


  }


  supportsJson(): boolean {
    return true;
  }

  supportsSortNull() {
    return true;
  }


  async getCollectionNames(): Promise<string[]> {
    const c = await this.storageRef.connect();
    const q = await c.query('SELECT table_name as name FROM information_schema.tables WHERE table_type=\'BASE TABLE\';');
    return map(q, x => x.name);
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
      case 'double':
      case 'float':
        type = 'float8';
        break;
      case 'bigint':
      case 'bignumber':
        type = 'bigint';
        break;
      case 'time':
        type = 'time';
        break;
      case 'date':
        type = 'date';
        if (opts && opts.variant) {
          type = 'timestamp with time zone';
        }
        break;
      case 'datetime':
        type = 'timestamp with time zone';
        break;
      case 'timestamp':
        type = 'timestamp with time zone';
        break;
      case 'object':
      case 'array':
      case 'json':
        type = 'jsonb';
        break;

    }
    return type;
  }


}
