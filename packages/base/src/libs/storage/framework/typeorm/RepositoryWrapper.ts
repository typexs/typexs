import { IObjectHandle } from '../IObjectHandle';
import { TypeOrmConnectionWrapper } from './TypeOrmConnectionWrapper';
import { EntityType } from '../Constants';
import { MongoRepository, UpdateQueryBuilder } from 'typeorm';
import { NotSupportedError, NotYetImplementedError } from '@allgemein/base';
import { get, has, isArray, isEmpty } from 'lodash';
import { TypeOrmSqlConditionsBuilder } from './TypeOrmSqlConditionsBuilder';
import { convertPropertyValueJsonToString } from './Helper';
import { TypeOrmEntityRegistry } from './schema/TypeOrmEntityRegistry';

/**
 * Wrapper handling typeorm object operations
 */
export class RepositoryWrapper<T> implements IObjectHandle<T> {

  /**
   * Reference to typeorm connection
   */
  connection: TypeOrmConnectionWrapper;

  /**
   * Entity type to handle
   */
  entityType: EntityType<T>;


  constructor(connection: TypeOrmConnectionWrapper, entityType: EntityType<T>) {
    this.connection = connection;
    this.entityType = entityType;
  }


  getEntityRef() {
    return TypeOrmEntityRegistry.$().getEntityRefFor(this.entityType);
  }

  isMongo() {
    return this.connection.getStorageRef().dbType === 'mongo';
  }

  hasJsonSupport() {
    return this.connection.storageRef.getSchemaHandler().supportsJson();
  }

  /**
   * Get typeorm repository handle for the object
   */
  getRepository() {
    if (this.isMongo()) {
      return this.getMongoRepository();
    }
    return this.getSqlRepository();
  }

  getMongoRepository() {
    return this.connection.getEntityManager().getMongoRepository(this.entityType);
  }

  getSqlRepository() {
    return this.connection.getEntityManager().getRepository(this.entityType);
  }

  count(conditions: any): Promise<number> {
    return this.getRepository().count(conditions);
  }

  save(obj: T, opts?: any): Promise<T> ;
  save(obj: T[], opts?: any): Promise<T[]>;
  async save(obj: T | T[], opts?: any): Promise<T | T[]> {
    const _isArr = isArray(obj);
    await this.connection.acquire('write');
    return this.getRepository()
      .save((_isArr ? obj : [obj]) as T[], opts)
      .then(x => _isArr ? x : x.shift())
      .finally(() => {
        this.connection.release('write');
      });
  }

  async aggregate(clonePipeline: any[]): Promise<any> {
    const repo = this.getRepository();
    if (repo instanceof MongoRepository) {
      const p = await repo.aggregate(clonePipeline);
      return p.toArray();
    } else {
      throw new NotYetImplementedError();
    }
  }

  async deleteByCondition(condition: any): Promise<number> {
    const repo = this.getRepository();
    if (repo instanceof MongoRepository) {
      const p = await repo.deleteMany(condition);
      return p.deletedCount;
    } else {
      const p = await repo.delete(condition);
      return p.affected;
    }
  }


  async updateByCondition(condition: any, update: any, options: any): Promise<number> {
    const repo = this.getRepository();
    if (repo instanceof MongoRepository) {
      const p = await repo.updateMany(condition, update, options);
      return p.modifiedCount;
    } else {
      const entityRef = this.getEntityRef();
      const connection = this.connection;
      let affected = -1;
      let qb: UpdateQueryBuilder<T> = null;
      if (condition) {
        const builder = new TypeOrmSqlConditionsBuilder<T>(
          connection.getEntityManager(), entityRef, this.connection.getStorageRef(), 'update');
        builder.build(condition);
        qb = builder.getQueryBuilder() as UpdateQueryBuilder<T>;
        // qb.where(where);
      } else {
        qb = connection.getEntityManager()
          .getRepository(entityRef.getClassRef().getClass())
          .createQueryBuilder().update() as UpdateQueryBuilder<T>;
      }

      // TODO make this better currently Hacki hacki
      let hasUpdate = false;
      let updateData = null;
      if (has(update, '$set')) {
        updateData = update['$set'];
        hasUpdate = true;
      } else if (!isEmpty(update)) {
        updateData = update;
        hasUpdate = true;
      }
      affected = 0;

      if (hasUpdate) {

        if (!this.hasJsonSupport()) {
          convertPropertyValueJsonToString(entityRef, updateData, true);
        }
        qb.set(updateData);

        if (has(options, 'limit')) {
          qb.limit(options['limit']);
        }
        await connection.acquire('write');
        const r = await qb.execute().finally(() => connection.release('write'));
        affected = get(r, 'affected', -2);
      }
      return affected;
    }
  }


  async remove(obj: T[], opts?: any): Promise<any> {
    return this.getRepository().remove(obj, opts);
  }


  async find(condition?: any, opts?: any): Promise<T[]> {
    if (condition) {
      return this.getRepository().find(condition);
    } else {
      return this.getRepository().find();
    }

  }


  async findOne(condition?: any, opts?: any): Promise<T> {
    if (condition) {
      return this.getRepository().findOne(condition);
    } else {
      return this.getRepository().findOne();
    }

  }
}
