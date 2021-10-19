import {IEntityRef} from '@allgemein/schema-api';
import {IIndexRef} from './IIndexRef';

export interface IEntityIndexRef extends IIndexRef {
  typeName: string;
  entity: IEntityRef;
  idxClass?: Function;
}
