import * as _ from 'lodash';
import { ElasticEntityController } from '../ElasticEntityController';
import { ClassType } from '@allgemein/schema-api';
import { IndexEntityRef } from '../../registry/IndexEntityRef';
import { MatchUtils } from '@typexs/base/libs/utils/MatchUtils';
import { __ID__, ES_IDFIELD } from '../../Constants';
import { ElasticUtils } from '../ElasticUtils';

export class OpsHelper {

  static getId(entityRef: IndexEntityRef, entity: any, typed: boolean = true) {
    let id = null;
    if (_.has(entity, ES_IDFIELD)) {
      id = entity[ES_IDFIELD];
    } else if (_.has(entity, __ID__)) {
      id = entity[__ID__];
    } else {
      const idPropertyRefs = entityRef.getPropertyRefs().filter(p => p.isIdentifier());
      if (idPropertyRefs.length === 0) {
        throw new Error('no id property found for ' + entityRef.name);
      }

      id = idPropertyRefs.map(x => _.get(entity, x.name) + '').join('--') + '';
    }
    if (_.isEmpty(id)) {
      throw new Error(
        'no id could be generate for ' + entityRef.name);
    }

    if (typed) {
      if (id.startsWith(entityRef.getTypeName() + '-')) {
        return id;
      }
      return ElasticUtils.buildIdQuery(entityRef, id);
    }
    return id;

  }


  static getIndexTypes(controller: ElasticEntityController, entityTypes: (Function | string | ClassType<any>)[]): IndexEntityRef[] {
    const indexEntityRefs = [];
    for (const entityType of entityTypes) {
      if (_.isString(entityType) && entityType === '*') {
        indexEntityRefs.push(...controller.getStorageRef().getEntityRefs());
      } else if (_.isString(entityType) && entityType === '*') {
        indexEntityRefs.push(...controller.getStorageRef().getEntityRefs());
      } else {
        const find = controller.forIndexType(entityType);
        if (find) {
          indexEntityRefs.push(find);
        } else {
          throw new Error('no index entity found for ' + entityType);
        }
      }
    }

    if (_.isEmpty(indexEntityRefs)) {
      throw new Error('no index entity refs found');
    }
    return indexEntityRefs;

  }


  static hasEntityRefByPattern(cls: string, indexTypes: IndexEntityRef[]) {
    if (_.isString(cls)) {
      // if comma or wildcard
      const refLists = cls.split(',')
        .filter(x => !_.isEmpty(x)).map(x => x.trim());
      const refs = [];
      for (const ref of indexTypes) {
        for (const pattern of refLists) {
          if (/\*/.test(pattern) && (
            MatchUtils.miniMatch(pattern, ref.name) ||
            MatchUtils.miniMatch(pattern, _.snakeCase(ref.name)))) {
            return true;
          } else if (_.snakeCase(pattern) === _.snakeCase(ref.name)) {
            return true;
          } else if (pattern === ref.name) {
            return true;
          }
        }
      }
    }
    return false;
  }


  static getEntityRefByPattern(cls: string, indexTypes: IndexEntityRef[], byIndexedType: boolean = false) {
    const refs = [];
    if (_.isString(cls)) {
      // if comma or wildcard
      const refLists = cls.split(',')
        .filter(x => !_.isEmpty(x)).map(x => x.trim());

      for (const ref of indexTypes) {
        for (const pattern of refLists) {
          const name = ref.name;
          const snakeName = _.snakeCase(name);
          const snakePattern = _.snakeCase(pattern);
          if (byIndexedType) {
            const refName = ref.getEntityRef().name;
            const snakeRefName = _.snakeCase(refName);
            if (/\*/.test(pattern) && (
              MatchUtils.miniMatch(pattern, name) ||
              MatchUtils.miniMatch(pattern, snakeName) ||
              MatchUtils.miniMatch(pattern, refName) ||
              MatchUtils.miniMatch(pattern, snakeRefName)
            )) {
              refs.push(ref);
            } else if (snakePattern === snakeName) {
              refs.push(ref);
            } else if (snakePattern === snakeRefName) {
              refs.push(ref);
            } else if (pattern === refName) {
              refs.push(ref);
            } else if (pattern === name) {
              refs.push(ref);
            }
          } else {
            if (/\*/.test(pattern) && (
              MatchUtils.miniMatch(pattern, name) ||
              MatchUtils.miniMatch(pattern, snakeName))) {
              refs.push(ref);
            } else if (pattern === snakeName) {
              refs.push(ref);
            } else if (pattern === name) {
              refs.push(ref);
            }
          }
        }
      }

    }
    return refs;
  }

}
