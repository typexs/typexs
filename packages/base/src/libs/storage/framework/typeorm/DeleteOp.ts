import { isArray, isFunction } from '@typexs/generic';
import { IDeleteOp } from '../IDeleteOp';
import { TypeOrmUtils } from './TypeOrmUtils';
import { ClassType, RegistryFactory } from '@allgemein/schema-api';
import { TypeOrmSqlConditionsBuilder } from './TypeOrmSqlConditionsBuilder';
import { TypeOrmEntityRegistry } from './schema/TypeOrmEntityRegistry';
import { IDeleteOptions } from '../IDeleteOptions';
import { DeleteQueryBuilder } from 'typeorm';
import { EntityControllerApi } from '../../../../api/EntityController.api';
import { TypeOrmEntityController } from './TypeOrmEntityController';
import { TypeOrmConnectionWrapper } from './TypeOrmConnectionWrapper';
import { REGISTRY_TYPEORM } from './Constants';


export class DeleteOp<T> implements IDeleteOp<T> {

  readonly controller: TypeOrmEntityController;

  error: Error = null;

  private objects: any[] = [];

  protected removable: T[] | T | ClassType<T>;

  protected conditions: any;

  protected options: IDeleteOptions;

  constructor(controller: TypeOrmEntityController) {
    this.controller = controller;
  }

  private isMongoDB() {
    return this.controller.storageRef.dbType === 'mongodb';
  }


  getRemovable() {
    return this.removable;
  }

  getOptions() {
    return this.options;
  }

  getConditions() {
    return this.conditions;
  }


  getNamespace(): string {
    return REGISTRY_TYPEORM;
  }

  getRegistry() {
    return RegistryFactory.get(this.getNamespace());
  }


  getController(): TypeOrmEntityController {
    return this.controller;
  }

  async run(object: T[] | T | ClassType<T>, conditions: any = null, options: IDeleteOptions = {}): Promise<number> {
    this.removable = object;
    this.conditions = conditions;
    this.options = options;

    await this.controller.invoker.use(EntityControllerApi).doBeforeRemove(this);

    let results: number | T[];
    if (isFunction(object)) {
      results = await this.removeByCondition(<ClassType<T>>object, conditions, options);
    } else {
      results = await this.remove(<T | T[]>object, options);
    }

    await this.controller.invoker.use(EntityControllerApi).doAfterRemove(results, this.error, this);

    if (this.error) {
      throw this.error;
    }

    return results;
  }

  private async removeByCondition(object: ClassType<T>, condition: any, options: IDeleteOptions = {}) {
    let count = -1;
    let connection: TypeOrmConnectionWrapper = null;
    try {
      const entityName = TypeOrmUtils.resolveName(object);
      if (this.isMongoDB()) {
        connection = await this.controller.connect();
        return connection.for(entityName).deleteByCondition(condition);
      } else {
        const entityRef = TypeOrmEntityRegistry.$().getEntityRefByName(entityName);
        connection = await this.controller.connect();
        if (connection.isSingleConnection()) {
          options.noTransaction = true;
        }

        if (options.noTransaction) {
          const x = new TypeOrmSqlConditionsBuilder(
            connection.getEntityManager(), entityRef, this.controller.getStorageRef(), 'delete');
          const qb = x.getQueryBuilder() as DeleteQueryBuilder<any>;
          x.build(condition);
          const result = await qb/* .where(x.build(condition)) */.execute();
          count = result.affected ? result.affected : -2;
        } else {
          await connection.getEntityManager().transaction(async em => {
            const x = new TypeOrmSqlConditionsBuilder(em, entityRef, this.controller.getStorageRef(), 'delete');
            const qb = x.getQueryBuilder() as DeleteQueryBuilder<any>;
            x.build(condition);
            const result = await qb.execute();
            // depends by db type
            count = result.affected ? result.affected : -2;
            return result.affected;
          });
        }

        // start transaction, got to leafs and save
      }
    } catch (e) {
      this.error = e;
    } finally {
      if (connection) {
        await connection.close();
      }
    }
    return count;
  }

  private async remove(object: T[] | T, options: IDeleteOptions = {}) {
    // const _isArray = isArray(object);
    const connection = await this.controller.connect();
    let promiseResults: any[][] = null;
    let affected = -1;
    try {
      this.objects = this.prepare(object);

      const resolveByEntityDef = TypeOrmUtils.resolveByEntityRef(this.objects);
      const entityNames = Object.keys(resolveByEntityDef);

      if (this.isMongoDB()) {
        const promises = [];
        for (const entityName of entityNames) {
          const p = connection.for(entityName).remove(resolveByEntityDef[entityName]);
          promises.push(p);
        }
        promiseResults = await Promise.all(promises);
      } else {
        // start transaction, got to leafs and save
        if (connection.isSingleConnection()) {
          options.noTransaction = true;
        }

        if (options.noTransaction) {
          const promises = [];
          for (const entityName of entityNames) {
            const p = connection.for(entityName).remove(resolveByEntityDef[entityName]);
            promises.push(p);
          }
          promiseResults = await Promise.all(promises);
        } else {
          promiseResults = await connection.getEntityManager().transaction(async em => {
            const promises = [];
            for (const entityName of entityNames) {
              const p = em.getRepository(entityName).remove(resolveByEntityDef[entityName]);
              promises.push(p);
            }
            return Promise.all(promises);
          });
        }
      }

      if (promiseResults) {
        affected = 0;
        entityNames.map((value, index) => {
          affected += promiseResults[index].length;
        });
      }

    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();
    }

    // if (!isArray) {
    //   return this.objects.shift();
    // }

    return affected;

  }


  private prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


}
