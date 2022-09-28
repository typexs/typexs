import { IStorageRef, StorageRef } from '@typexs/base';
import { defaults } from 'lodash';
import { ILdapStorageRefOptions } from './ILdapStorageRefOptions';
import { C_LDAP } from '../Constants';
import { LdapEntityController } from './LdapEntityController';

export class LdapStorageRef extends StorageRef implements IStorageRef {


  constructor(options: ILdapStorageRefOptions) {
    super(defaults(options, <ILdapStorageRefOptions>{
      framework: C_LDAP
      // type: C_ELASTIC_SEARCH,
      // host: '127.0.0.1',
      // port: 9200
    }));
  }

  addEntityClass(type: Function | | <any>, options?: any): void;
  addEntityClass(type: Function | | <any>, options?: any): void;
  addEntityClass(type: Function | | <any>, options?: any): void {
  }

  connect(): Promise<IConnection> {
    return Promise.resolve(undefined);
  }

  getController(): LdapEntityController {
    return undefined;
  }

  getEntityNames(): string[] {
    return [];
  }

  getEntityRef(name: string | Function);
  getEntityRef(name: string | Function): | [];
  getEntityRef(name: string | Function): | [] {
    return undefined;
  }

  getEntityRefs(): [];
  getEntityRefs(): [];
  getEntityRefs(): [] {
    return [];
  }

  getFramework(): string {
    return '';
  }

  getRawCollection(name: string): ICollection | Promise<ICollection> {
    return undefined;
  }

  getRawCollectionNames(): string[] | Promise<string[]> {
    return undefined;
  }

  getRawCollections(collectionNames: string[]): ICollection[] | Promise<ICollection[]> {
    return undefined;
  }

  getRegistry();
  getRegistry();
  getRegistry() {
    return undefined;
  }

  getType(): string {
    return '';
  }

  hasEntityClass(cls: string | Function |): boolean;
  hasEntityClass(cls: string | Function |): boolean;
  hasEntityClass(cls: string | Function |): boolean {
    return false;
  }

  isActive(): boolean {
    return false;
  }

  prepare(): boolean | Promise<boolean> {
    return undefined;
  }

  reload(): Promise<boolean> | boolean {
    return undefined;
  }

  shutdown(full?: boolean): void {
  }


}
