import { ISaveOptions } from './framework/ISaveOptions';
import { IFindOptions } from './framework/IFindOptions';
import { IEntityRef, ISchemaRef } from '@allgemein/schema-api';
import { IUpdateOptions } from './framework/IUpdateOptions';
import { IAggregateOptions } from './framework/IAggregateOptions';
import { IDeleteOptions } from './framework/IDeleteOptions';
import { CLS_DEF } from '../Constants';
import { IStorageRef } from './IStorageRef';

/**
 * Abstraction for an backend entity managing and querying interface. Condition should be passed in mango schema.
 */
export interface IEntityController {

  name(): string;

  forClass(cls: CLS_DEF<any>): IEntityRef;

  /**
   * Return query for id search
   *
   * @param cls
   * @param entity
   */
  entityIdQuery?(cls: IEntityRef, entity: any): any;

  findOne<T>(fn: CLS_DEF<T>, conditions?: any, options?: IFindOptions): Promise<T>;

  find<T>(fn: CLS_DEF<T>, conditions?: any, options?: IFindOptions): Promise<T[]>;

  save<T>(object: T, options?: ISaveOptions): Promise<T>;

  save<T>(object: T[], options?: ISaveOptions): Promise<T[]>;

  remove<T>(object: T | T[], options?: IDeleteOptions): Promise<number>;

  remove<T>(cls: CLS_DEF<T>, condition?: any, options?: IDeleteOptions): Promise<number>;

  update<T>(cls: CLS_DEF<T>, condition: any, update: any, options?: IUpdateOptions): Promise<number>;

  aggregate<T>(baseClass: CLS_DEF<T>, pipeline: any[], options?: IAggregateOptions): Promise<any[]>;

  /**
   * Return schema reference of this controller if one exists
   */
  getSchemaRef?(): ISchemaRef;

  /**
   * Return the storage reference of this controller
   */
  getStorageRef?(): IStorageRef;

  /**
   * Pass a raw query without any abstraction directly to the backend system
   *
   * @param query
   * @param options
   */
  rawQuery?(query: any, options?: any): any;
}
