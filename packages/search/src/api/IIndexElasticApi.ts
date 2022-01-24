import { IndexEntityRef } from '../lib/registry/IndexEntityRef';
import { IFindOp } from '@typexs/base/libs/storage/framework/IFindOp';
import { IUpdateOp } from '@typexs/base/libs/storage/framework/IUpdateOp';
import { IDeleteOp } from '@typexs/base/libs/storage/framework/IDeleteOp';
import { IAggregateOp } from '@typexs/base/libs/storage/framework/IAggregateOp';
import { ISaveOp } from '@typexs/base/libs/storage/framework/ISaveOp';
import { ElasticMapping } from '../lib/elastic/mapping/ElasticMapping';

export interface IIndexElasticApi {

  onOptions?(stage: 'find' | 'update' | 'aggregate' | 'remove' | 'save', options: any): void;

  isIndexable?(className: string, obj: any, registry: string): boolean;

  doBeforeIndexRepositoryCreate?(indexData: ElasticMapping, types: IndexEntityRef[]): void;

  prepareBeforeSave?<T>(className: string, object: T): void;

  doBeforeSave?<T>(object: T[] | T, op: ISaveOp<T>): void;

  doAfterSave?<T>(object: T[] | T, error: Error, op: ISaveOp<T>): void;

  doBeforeFind?<T>(op: IFindOp<T>): void;

  doAfterFind?<T>(results: T[], error: Error, op: IFindOp<T>): void;

  doBeforeUpdate?<T>(op: IUpdateOp<T>): void;

  doAfterUpdate?<T>(results: number, error: Error, op: IUpdateOp<T>): void;

  doBeforeRemove?<T>(op: IDeleteOp<T>): void;

  doAfterRemove?<T>(results: number | T[], error: Error, op: IDeleteOp<T>): void;

  doBeforeAggregate?<T>(op: IAggregateOp): void;

  doAfterAggregate?<T>(results: T[], error: Error, op: IAggregateOp): void;

}
