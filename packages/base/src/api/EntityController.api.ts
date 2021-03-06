import { IEntityControllerApi } from './IEntityControllerApi';
import { IFindOp } from '../libs/storage/framework/IFindOp';
import { IUpdateOp } from '../libs/storage/framework/IUpdateOp';
import { IDeleteOp } from '../libs/storage/framework/IDeleteOp';
import { IAggregateOp } from '../libs/storage/framework/IAggregateOp';
import { ISaveOp } from '../libs/storage/framework/ISaveOp';


export class EntityControllerApi implements IEntityControllerApi {

  doBeforeFind<T>(op: IFindOp<T>) {
  }

  doAfterFind<T>(results: T[], error: Error, op: IFindOp<T>) {
  }

  doBeforeUpdate<T>(op: IUpdateOp<T>) {
  }

  doAfterUpdate<T>(results: number, error: Error, op: IUpdateOp<T>) {
  }

  doBeforeSave<T>(object: T[] | T, op: ISaveOp<T>) {
  }

  doAfterSave<T>(object: T[] | T, error: Error, op: ISaveOp<T>) {
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
