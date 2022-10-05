import { ClientOptions } from './LdapOptions';
import * as ldapjs from 'ldapjs';
import { SearchOptions } from 'ldapjs';
import { Log } from '@typexs/base';

export class LdapClient {

  name: string;

  options: ClientOptions;

  client: ldapjs.Client;

  connected: boolean = false;

  bound: boolean = false;

  lastError: Error = null;

  constructor(name: string, options: ClientOptions) {
    this.name = name;
    this.options = options;
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client = ldapjs.createClient(this.options);
      this.client.on('error', this.onError.bind(this));
      this.client.on('connectTimeout', this.onError.bind(this));
      this.client.on('connect', this.onConnect.bind(this));
      this.client.on('_connected', resolve);
      this.client.on('_errored', reject);
    });
  }


  bind(user: string, passowrd: string) {
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


  search(searchBase: string, options: SearchOptions): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.bound) {
        reject(new Error('ldap not bound'));
      }
      this.client.search(searchBase, options, (err, res) => {
        if (err) {
          return reject(err);
        }

        const items: any[] = [];
        res.on('searchEntry', (entry) => {
          items.push(entry.object);
        });

        res.on('error', reject);

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
  }
}
