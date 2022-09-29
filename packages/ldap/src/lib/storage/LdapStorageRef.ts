import { ICollection, IStorageRef, StorageRef } from '@typexs/base';
import { defaults } from 'lodash';
import { ILdapStorageRefOptions } from './ILdapStorageRefOptions';
import { C_LDAP } from '../Constants';
import { LdapEntityController } from './LdapEntityController';
import { LdapConnection } from './LdapConnection';
import { ClassType, RegistryFactory } from '@allgemein/schema-api';
import { LdapEntityRegistry } from '../registry/LdapEntityRegistry';

export class LdapStorageRef extends StorageRef implements IStorageRef {


  constructor(options: ILdapStorageRefOptions) {
    super(defaults(options, <ILdapStorageRefOptions>{
      framework: C_LDAP
      // type: C_ELASTIC_SEARCH,
      // host: '127.0.0.1',
      // port: 9200
    }));
  }

  initialize?(): boolean | Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  addEntityClass(type: Function | ClassType<any>, options?: any): void {
  }

  connect(): Promise<LdapConnection> {
    return Promise.resolve(undefined);
  }

  getController(): LdapEntityController {
    return undefined;
  }

  getEntityNames(): string[] {
    return [];
  }

  getEntityRef(name: string | Function): any | [] {
    return undefined;
  }

  getEntityRefs(): [] {
    return [];
  }

  getFramework(): string {
    return C_LDAP;
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

  getRegistry() {
    return RegistryFactory.get(C_LDAP) as LdapEntityRegistry;
  }

  getType(): string {
    return C_LDAP;
  }

  hasEntityClass(cls: string | Function | ClassType<any>): boolean {
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
