import { IConnection, Log } from '@typexs/base';
import { LdapStorageRef } from './LdapStorageRef';
import * as ldapjs from 'ldapjs';
import { Control, LDAPResult, SearchEntry, SearchRequest, SizeLimitExceededError } from 'ldapjs';
// import { PagedResultsControl } from 'ldapjs/lib/controls';
import { ILdapSearchOptions } from './ILdapSearchOptions';

const PagedResultsControl = require('ldapjs/lib/controls').PagedResultsControl;

export class LdapConnection implements IConnection {

  private storageRef: LdapStorageRef;

  client: ldapjs.Client;

  connected: boolean = false;

  bound: boolean = false;

  lastError: Error = null;

  usage: number = 0;

  constructor(storageRef: LdapStorageRef) {
    this.storageRef = storageRef;
  }

  get name() {
    return this.storageRef.getName();
  }

  async connect(): Promise<LdapConnection> {
    const user = this.storageRef.getOptions().bindDN;
    const pass = this.storageRef.getOptions().bindCredentials;
    try {
      const connected = await this.doConnect();
      if (connected) {
        await this.bind(user, pass);
      }
    } catch (e) {
    }
    return this;
  }

  doConnect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client = ldapjs.createClient(this.storageRef.getOptions());
      this.client.on('error', this.onError.bind(this));
      this.client.on('connectTimeout', this.onError.bind(this));
      this.client.on('connect', this.onConnect.bind(this));
      this.client.on('_connected', resolve);
      this.client.on('_errored', reject);
    });
  }

  async close() {
    if (this.client) {
      if (this.connected) {
        this.client.unbind((err: Error) => {
          if (err) {
            Log.error('ldap unbind', err.message);
          }
        });
      }
    }
    this.bound = false;
    this.connected = false;
    return this;
  }

  bind(user: string, passowrd: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.bound) {
        resolve(this.bound);
      } else if (this.connected) {
        this.client.bind(user, passowrd, err => {
          if (err) {
            this.bound = false;
            this.lastError = err;
          } else {
            this.bound = true;

          }
          resolve(this.bound);
        });
      } else {
        reject(new Error('ldap client not connected'));
      }
    });
  }

  search(searchBase: string, options: ILdapSearchOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {

      if (!this.bound) {
        reject(new Error('ldap not bound'));
      }

      const controls: Control[] = [];
      // if (options.paged) {
      //   controls.push(new PagedResultsControl({ value: { size: this., cookie: '' } }));
      // }

      this.client.search(searchBase, options, controls,
        (err, res) => {

          if (err) {
            return reject(err);
          }

          const items: any[] = [];
          res.on('searchEntry', (entry: SearchEntry) => {
            items.push(entry.object);
          });
          res.on('page', (entry: LDAPResult) => {
            // console.log('');
            // const control = entry.controls.find(x => x.type === PagedResultsControl.OID)
            // options.cookie = control._value.cookie.toString();
          });
          res.on('error', err => {
            if (err instanceof SizeLimitExceededError) {
              resolve(items);
            } else {
              reject(err);
            }
          });
          res.on('end', (result) => {
            if (result.status !== 0) {
              const err = 'non-zero status from LDAP search: ' + result.status;
              reject(err);
            }
            resolve(items);
          });
        });
    });
  }


  onConnect() {
    this.connected = true;
    this.client.emit('_connected', this.connected);
  }


  onError(err: any) {
    Log.error('ldap client error ' + this.name, err);
    this.lastError = err;
    this.close();
    this.client.emit('_errored', err);
  }

  usageInc() {
    return ++this.usage;
  }


  usageDec() {
    if (this.usage > 0) {
      return --this.usage;
    }
    return this.usage;
  }


  getUsage() {
    return this.usage;
  }

  isOpened() {
    return this.connected;
  }

  isBound() {
    return this.bound;
  }

  hasError() {
    return !!this.lastError;
  }

  getLastError() {
    return this.lastError;
  }
}
