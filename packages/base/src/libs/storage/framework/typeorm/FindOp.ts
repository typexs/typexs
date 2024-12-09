import { assign, defaults, isEmpty, isNull, isNumber, isString } from '@typexs/generic';
import { IFindOp } from '../IFindOp';
import { IFindOptions } from '../IFindOptions';
import { XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '../../../Constants';
import { TypeOrmSqlConditionsBuilder } from './TypeOrmSqlConditionsBuilder';
import { ClassUtils, TreeUtils } from '@allgemein/base';
import { getMetadataArgsStorage, MongoRepository, SelectQueryBuilder } from 'typeorm';
import { ClassType, IEntityRef, RegistryFactory } from '@allgemein/schema-api';
import { EntityControllerApi } from '../../../../api/EntityController.api';
import { TypeOrmEntityController } from './TypeOrmEntityController';
import { Injector } from '../../../di/Injector';
import { Cache } from '../../../cache/Cache';
import { TypeOrmConnectionWrapper } from './TypeOrmConnectionWrapper';
import { convertPropertyValueStringToJson } from './Helper';
import { TypeOrmUtils } from './TypeOrmUtils';
import { REGISTRY_TYPEORM } from './Constants';
import { RepositoryWrapper } from './RepositoryWrapper';


export class FindOp<T> implements IFindOp<T> {

  readonly controller: TypeOrmEntityController;

  protected options: IFindOptions;

  protected entityType: Function | string | ClassType<T>;

  protected findConditions: any;

  protected error: Error = null;

  protected entityRef: IEntityRef = null;

  constructor(controller: TypeOrmEntityController) {
    this.controller = controller;
  }

  getFindConditions() {
    return this.findConditions;
  }

  getEntityType() {
    return this.entityType;
  }

  getOptions() {
    return this.options;
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


  async run(entityType: Function | string | ClassType<T>, findConditions?: any, options?: IFindOptions): Promise<T[]> {
    this.entityType = entityType;
    this.findConditions = findConditions;
    let cacheKey = null;
    let cache: Cache = null;
    let results: T[] = null;

    defaults(options, {
      limit: 50,
      offset: null,
      sort: null,
      cache: false,
      raw: false,
      typed: false
    });
    this.options = options;

    const jsonPropertySupport = this.controller.storageRef.getSchemaHandler().supportsJson();
    await this.controller.invoker.use(EntityControllerApi).doBeforeFind(this);

    if (options.cache) {
      cache = (Injector.get(Cache.NAME) as Cache);
      cacheKey = [
        REGISTRY_TYPEORM,
        FindOp.name,
        ClassUtils.getClassName(this.entityType),
        JSON.stringify(findConditions),
        JSON.stringify(options)].join('--');
      results = await cache.get(cacheKey, 'storage_typeorm');
    }

    this.entityRef = this.controller.getStorageRef().getRegistry().getEntityRefFor(entityType);
    if (isNull(results)) {
      if (this.controller.storageRef.dbType === 'mongodb') {
        results = await this.findMongo(entityType, findConditions);
      } else {
        results = await this.find(entityType, findConditions);
      }
    }

    if (!jsonPropertySupport) {
      // const entityRef = TypeOrmEntityRegistry.$().getEntityRefFor(entityType);
      convertPropertyValueStringToJson(this.entityRef, results);
    }
    await this.controller.invoker.use(EntityControllerApi).doAfterFind(results, this.error, this);

    if (this.error) {
      throw this.error;
    }

    if (cacheKey) {
      cache.set(cacheKey, results, 'storage_typeorm', { ttl: 120000 }).catch(reason => {
      });
    }

    return results;
  }


  // eslint-disable-next-line @typescript-eslint/ban-types
  private async find(entityType: Function | string | ClassType<T>, findConditions?: any): Promise<T[]> {
    let connection: TypeOrmConnectionWrapper = null;
    let results: T[] = [];
    try {
      // const repo = connection.for(entityType);
      // const qb = repo.createQueryBuilder() as SelectQueryBuilder<T>;
      let qb: SelectQueryBuilder<T> = null;
      // connect only when type is already loaded
      connection = await this.controller.connect();
      if (findConditions && !isEmpty(findConditions)) {
        const builder = new TypeOrmSqlConditionsBuilder<T>(
          connection.getEntityManager(), this.entityRef, this.controller.getStorageRef(), 'select');
        builder.build(findConditions);
        qb = builder.getQueryBuilder() as SelectQueryBuilder<T>;
      } else {
        qb = connection.getEntityManager().getRepository(entityType).createQueryBuilder() as SelectQueryBuilder<T>;
      }

      if (this.options.eager) {
        const refs = this.entityRef.getPropertyRefs().filter(x => x.isReference());
        for (const ref of refs) {
          const joinColumn = getMetadataArgsStorage().joinColumns
            .find(x => x.target === this.entityRef.getClass() && x.propertyName === ref.name);
          if (joinColumn) {
            qb.leftJoinAndSelect(
              [qb.alias, joinColumn.propertyName].join('.'),
              joinColumn.propertyName
            );
          } else {
            const relation = getMetadataArgsStorage().relations
              .find(x => x.target === this.entityRef.getClass() && x.propertyName === ref.name);
            if (relation) {
              if (
                relation.relationType === 'many-to-many' ||
                relation.relationType === 'many-to-one' ||
                relation.relationType === 'one-to-many') {
                qb.leftJoinAndSelect(
                  [qb.alias, relation.propertyName].join('.'),
                  relation.propertyName
                );
              }
            }
          }
        }
      }

      const recordCount = await qb.getCount();

      if (!isNull(this.options.limit) && isNumber(this.options.limit)) {
        qb.limit(this.options.limit);
      }

      if (!isNull(this.options.offset) && isNumber(this.options.offset)) {
        qb.offset(this.options.offset);
      }


      if (isNull(this.options.sort)) {
        this.entityRef.getPropertyRefs().filter(x => x.isIdentifier()).forEach(x => {
          qb.addOrderBy(TypeOrmUtils.aliasKey(qb, [x.name, x.storingName]), 'ASC');
        });
      } else {
         Object.keys(this.options.sort).forEach(sortKey => {
          const v: string = this.options.sort[sortKey];
          qb.addOrderBy(TypeOrmUtils.aliasKey(qb, sortKey), <'ASC' | 'DESC'>v.toUpperCase());
        });
      }

      // const q = qb.getSql();
      results = this.options.raw ? await qb.getRawMany() : await qb.getMany();
      results[XS_P_$COUNT] = recordCount;
      results[XS_P_$OFFSET] = this.options.offset;
      results[XS_P_$LIMIT] = this.options.limit;
    } catch (e) {
      this.error = e;
    } finally {
      if (connection) {
        await connection.close();
      }

    }

    return results;
  }


  private async findMongo(entityType: Function | string, findConditions?: any): Promise<T[]> {
    const results: T[] = [];
    const connection = await this.controller.connect();
    try {

      if (findConditions) {
        TreeUtils.walk(findConditions, x => {
          if (x.key && isString(x.key)) {
            if (x.key === '$like') {
              x.parent['$regex'] = x.parent[x.key].replace('%%', '#$#').replace('%', '.*').replace('#$#', '%%');
            }
          }
        });
      }

      const repo = connection.for(entityType) as RepositoryWrapper<any>;
      const recordCount = await repo.count(findConditions);
      const mongoRepo = repo.getRepository() as MongoRepository<any>;
      const qb = this.options.raw ? mongoRepo.createCursor(findConditions) : mongoRepo.createEntityCursor(findConditions);

      if (!isNull(this.options.limit) && isNumber(this.options.limit)) {
        qb.limit(this.options.limit);
      }

      if (!isNull(this.options.offset) && isNumber(this.options.offset)) {
        qb.skip(this.options.offset);
      }

      if (!isNull(this.options.sort)) {
        const s: any[] = [];
         Object.keys(this.options.sort).forEach(sortKey => {
          const v: string = this.options.sort[sortKey];
          s.push([sortKey, v === 'asc' ? 1 : -1]);
        });
        qb.sort(s);
      }

      // const recordCount = await qb.count(false);
      while (await qb.hasNext()) {
        if (this.options.raw && this.options.typed) {
          const instance = this.entityRef.create(false) as T;
          assign(instance, await qb.next());
          results.push(instance);
        } else {
          results.push(await qb.next());
        }

      }

      results[XS_P_$COUNT] = recordCount;
      results[XS_P_$OFFSET] = this.options.offset;
      results[XS_P_$LIMIT] = this.options.limit;
    } catch (e) {
      this.error = e;
    } finally {
      await connection.close();

    }

    return results;
  }

}


