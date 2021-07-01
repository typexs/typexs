import {IEntityRef} from 'commons-schema-api/browser';
import {IIndexRef} from './IIndexRef';

export interface IEntityIndexRef extends IIndexRef {
  typeName: string;
  entity: IEntityRef;
  idxClass?: Function;
}
