import { ISchemaMapper } from './ISchemaMapper';
import { EntityController } from '../EntityController';
import { IDeleteOp, IFindOp, ISaveOp, IStorageRef } from '@typexs/base';
import { ISchemaRef } from '@allgemein/schema-api';

export interface IFramework {

  on(storageRef: IStorageRef): boolean;

  getSchemaMapper(storageRef: IStorageRef, schemaDef: ISchemaRef): ISchemaMapper;

  getFindOp<T>(entityController: EntityController): IFindOp<T>;

  getDeleteOp<T>(entityController: EntityController): IDeleteOp<T>;

  getSaveOp<T>(entityController: EntityController): ISaveOp<T>;
}
