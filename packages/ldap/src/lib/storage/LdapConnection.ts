import { IConnection } from '@typexs/base';
import { LdapStorageRef } from './LdapStorageRef';

export class LdapConnection implements IConnection {

  private storageRef: LdapStorageRef;

  // private options:

  constructor(storageRef: LdapStorageRef /* , options: ClientOptions*/) {
    this.storageRef = storageRef;
    // this.options = options;
  }

  get name() {
    return this.storageRef.getName();
  }

  // async ping(): Promise<any> {
  //   return this.client.ping({});
  // }
  connect(): Promise<IConnection> {
    return Promise.resolve(undefined);
  }

  close(): Promise<IConnection> {
    return Promise.resolve(undefined);
  }
}
