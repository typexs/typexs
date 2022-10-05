import { CLS_DEF, ICollection, IStorageRef, StorageRef } from '@typexs/base';
import { defaults, isFunction, isString, snakeCase } from 'lodash';
import { ILdapStorageRefOptions } from './ILdapStorageRefOptions';
import { C_LDAP } from '../Constants';
import { LdapEntityController } from './LdapEntityController';
import { LdapConnection } from './LdapConnection';
import { ClassType, RegistryFactory, METATYPE_ENTITY, IEntityRef, ClassRef } from '@allgemein/schema-api';
import { LdapEntityRegistry } from '../registry/LdapEntityRegistry';
import { LdapGenericObject } from '../registry/LdapGenericObject';
import { NotYetImplementedError } from '@allgemein/base';

export class LdapStorageRef extends StorageRef implements IStorageRef {

  controller: LdapEntityController;

  constructor(options: ILdapStorageRefOptions) {
    super(defaults(options, <ILdapStorageRefOptions>{
      framework: C_LDAP,
      protocol: 'ldap',
      host: '127.0.0.1',
      port: 389
    }));

    // apply generic object
    if (this.getOptions().entities.indexOf(LdapGenericObject) === -1) {
      this.getOptions().entities.unshift(LdapGenericObject);
    }
  }

  prepare(): boolean {
    // register default object
    this.controller = new LdapEntityController(this);
    return true;
  }

  // addEntityClass(type: Function | ClassType<any>, options?: any): void {
  // }

  connect(): Promise<LdapConnection> {
    const connection = new LdapConnection(this);
    return connection.connect();
  }

  /**
   * Get options for ldap storage settings
   */
  getOptions(): ILdapStorageRefOptions {
    return super.getOptions() as ILdapStorageRefOptions;
  }

  getController(): LdapEntityController {
    return this.controller;
  }

  getEntityNames(): string[] {
    return this.getRegistry().getEntityRefs().map(x => x.name);
  }

  getEntityRef(name: CLS_DEF<any>): IEntityRef {
    const clazz = ClassRef.getClassName(name);
    if (clazz) {
      return this.getRegistry().getEntityRefs().find(x => snakeCase(x.name) === snakeCase(clazz));
    }
    return null;
  }

  getEntityRefs() {
    return this.getRegistry().getEntityRefs();
  }

  getFramework(): string {
    return C_LDAP;
  }

  getRegistry() {
    return RegistryFactory.get([C_LDAP, this.name].join('.')) as LdapEntityRegistry;
  }

  /**
   * Return the only type "ldap" which exists
   */
  getType(): string {
    return C_LDAP;
  }

  hasEntityClass(cls: CLS_DEF<any>): boolean {
    return !!this.getEntityRef(cls);
  }


  isActive(): boolean {
    return true;
  }


  reload(): Promise<boolean> | boolean {
    return undefined;
  }

  shutdown(full?: boolean): void {
  }


  getRawCollection(name: string): ICollection | Promise<ICollection> {
    throw new NotYetImplementedError('getRawCollection is no implemented.');
  }

  getRawCollectionNames(): string[] | Promise<string[]> {
    throw new NotYetImplementedError('getRawCollectionNames is no implemented.');
  }

  getRawCollections(collectionNames: string[]): ICollection[] | Promise<ICollection[]> {
    throw new NotYetImplementedError('getRawCollections is no implemented.');
  }

}
