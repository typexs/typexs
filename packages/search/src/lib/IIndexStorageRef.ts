import {IStorageRef} from '@typexs/base';
import {IClassRef} from 'commons-schema-api/browser';
import {IndexEntityRef} from './registry/IndexEntityRef';

export interface IIndexStorageRef extends IStorageRef {


  getEntityRef(name: string | Function | IClassRef, byIndexedType?: boolean): IndexEntityRef;

  refresh(indexNames: string[]): Promise<any>;

}
