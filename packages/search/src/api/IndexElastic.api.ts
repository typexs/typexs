import {IIndexElasticApi} from './IIndexElasticApi';
import {IndexEntityRef} from '../lib/registry/IndexEntityRef';
import {ISaveOp} from '@typexs/base/libs/storage/framework/ISaveOp';
import {IFindOp} from '@typexs/base/libs/storage/framework/IFindOp';
import {IUpdateOp} from '@typexs/base/libs/storage/framework/IUpdateOp';
import {IDeleteOp} from '@typexs/base/libs/storage/framework/IDeleteOp';
import {IAggregateOp} from '@typexs/base/libs/storage/framework/IAggregateOp';


export class IndexElasticApi implements IIndexElasticApi {

  isIndexable(className: string, obj: any, registry: string): boolean {
    return true;
  }

  onOptions(stage: 'find' | 'update' | 'aggregate' | 'remove' | 'save', options: any) {
  }

  doBeforeIndexRepositoryCreate(indexData: any, types: IndexEntityRef[]) {
  }

  /**
   * used in extend storage api
   * @param className
   * @param object
   */
  prepareBeforeSave<T>(className: string, object: T) {
  }

  doBeforeSave<T>(object: T[] | T, op: ISaveOp<T>) {
  }

  doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
  }


  doBeforeFind<T>(op: IFindOp<T>) {
  }

  doAfterFind<T>(results: T[], error: Error, op: IFindOp<T>) {
  }

  doBeforeUpdate<T>(op: IUpdateOp<T>) {
  }

  doAfterUpdate<T>(results: number, error: Error, op: IUpdateOp<T>) {
  }

  doBeforeRemove<T>(op: IDeleteOp<T>) {
  }

  doAfterRemove<T>(results: number | T[], error: Error, op: IDeleteOp<T>) {
  }


  doBeforeAggregate<T>(op: IAggregateOp) {
  }

  doAfterAggregate<T>(results: T[], error: Error, op: IAggregateOp) {
  }

}
