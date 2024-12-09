import { PropertyRef } from '../../registry/PropertyRef';
import { INameResolver } from '../INameResolver';
import {
  chunk,
  concat,
  get,
  isArray,
  isBoolean,
  isDate,
  isEmpty,
  isNull,
  isNumber,
  isObjectLike,
  isString,
  map,
  merge,
  orderBy
} from '@typexs/generic';


import { SqlConditionsBuilder } from './SqlConditionsBuilder';
import { TypeOrmConnectionWrapper, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '@typexs/base';
import { EntityRef } from '../../../libs/registry/EntityRef';
import { IFindOptions } from '../IFindOptions';
import { __CLASS__, __NS__, IClassRef } from '@allgemein/schema-api';
import { OrderDesc } from '../../descriptors/OrderDesc';


const ignoreKeys = [__NS__, __CLASS__].map(x => x.toLowerCase());

export class SqlHelper {

  static getEmbeddedPropertyIds(propertyDef: PropertyRef) {
    let refProps: string[] = [];
    if (propertyDef.hasIdKeys()) {
      refProps = propertyDef.getIdKeys();
    } else {
      refProps = [propertyDef.storingName];
    }
    return refProps;
  }

  static resolveNameForEmbeddedIds(n: INameResolver, name: string, propertyDef: PropertyRef, prop: PropertyRef) {
    let targetName, targetId;
    if (propertyDef.hasIdKeys()) {
      [targetId, targetName] = n.for(name);
    } else {
      [targetId, targetName] = n.for(name, prop);
    }
    return [targetId, targetName];
  }

  static async execQuery<T>(
    connection: TypeOrmConnectionWrapper,
    entityRef: EntityRef,
    propertyRef: PropertyRef,
    conditions: any,
    opts: { orSupport?: boolean; limit?: number; offset?: number; sort?: any; mode?: 'delete' | 'select' } & IFindOptions) {

    let queue = [];
    const limit = opts.limit;
    const offset = opts.offset;
    const sortBy = opts.sort;
    const mode = opts.mode ? opts.mode : 'select';

    if (!isEmpty(conditions)) {
      if (isArray(conditions)) {
        queue = chunk(conditions, opts.maxConditionSplitingLimit);
      } else {
        queue.push(conditions);
      }
    } else {
      queue.push(null);
    }

    let results: any = {};
    let queryResults: any = [];
    const multipart = queue.length > 1;
    let recordCount = 0;

    const promises = [];

    while (queue.length > 0) {
      const cond = queue.shift();
      let qb: any = null;
      if (cond) {
        const builder = new SqlConditionsBuilder<T>(connection.getEntityManager(), entityRef, connection.getStorageRef(), mode);
        builder.build(opts.orSupport && isArray(cond) ? { $or: cond } : cond);
        qb = builder.getQueryBuilder() as any;
      } else {
        qb = connection.getEntityManager().getRepository(entityRef.getClass()).createQueryBuilder();
      }

      if (mode !== 'delete') {
        const _recordCount = await qb.getCount();
        recordCount = recordCount + _recordCount;
      }

      if (!multipart && mode !== 'delete') {
        if (!isNull(limit) && isNumber(limit)) {
          qb.limit(limit);
        }

        if (!isNull(offset) && isNumber(offset)) {
          qb.offset(offset);
        }

        if (isNull(sortBy)) {
          entityRef.getPropertyRefs().filter(x => !!x.isIdentifier()).forEach(x => {
            qb.addOrderBy(qb.alias + '.' + x.storingName, 'ASC');
          });
        } else if (propertyRef && propertyRef.hasOrder()) {
          const mapping = this.getTargetKeyMap(entityRef);
          propertyRef.getOrder().forEach((o: OrderDesc) => {
            qb.addOrderBy(get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
          });
        } else {
          if (isObjectLike(sortBy) && !isEmpty(sortBy)) {
             Object.keys(sortBy).forEach(sortKey => {
              qb.addOrderBy(qb.alias + '.' + sortKey, sortBy[sortKey].toUpperCase());
            });
          }
        }
      } else {
        // offset + limit

        // check limit reach
      }

      if (mode === 'delete') {
        promises.push(qb.execute());
      } else {
        const _results = await qb.getMany();
        queryResults = concat(queryResults, _results);
      }
    }

    if (mode === 'delete') {
      if (promises.length > 0) {
        return Promise.all(promises);
      } else {
        return [];
      }
    }

    if (multipart) {
      if (results.length > 0 && sortBy) {
        const iteree: any = [];
        const orders: any = [];
        for (const k of  Object.keys(sortBy)) {
          iteree.push(k);
          orders.push(sortBy[k].toLowerCase());
        }
        results = orderBy(results, iteree, orders);
      }
    }

    results = queryResults;
    results[XS_P_$COUNT] = recordCount;
    results[XS_P_$OFFSET] = offset;
    results[XS_P_$LIMIT] = limit;

    return results;

  }

  static getTargetKeyMap(targetRef: EntityRef | IClassRef) {
    const props: PropertyRef[] = targetRef instanceof EntityRef ?
      targetRef.getPropertyRefs() : targetRef.getRegistry().getPropertyRefsFor(targetRef) as PropertyRef[];
    return merge({}, ...map(props, p => {
      const c = {};
      // c[p.name] = p.storingName;
      c[p.name] = p.name;
      return c;
    }));
  }


  static conditionToQuery(condition: any): string {
    return  Object.keys(condition).map(k => `${k} = '${condition[k]}'`).join(' AND ');
  }

  static extractKeyableValues(data: any[]) {
    return data.map(obj => {
      const id: any = {};
       Object.keys(obj)
        .filter(k => !ignoreKeys.includes(k.toLowerCase()))
        .filter(k => isString(obj[k]) || isNumber(obj[k]) || isDate(obj[k]) || isBoolean(obj[k]))
        .map(k => id[k] = obj[k]);
      return id;
    });
  }


}
