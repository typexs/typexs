import { ILdapAuthOptions } from './ILdapAuthOptions';
import * as ldapjs from 'ldapjs';
import { EventEmitter } from 'events';
import { UserNotFoundError } from '../../../libs/exceptions/UserNotFoundError';
import { defaults, isEmpty, isUndefined } from 'lodash';
import { LdapClient } from './LdapClient';


export class LdapAuthPromise extends EventEmitter {

  options: ILdapAuthOptions;

  private clients: { [k: string]: LdapClient } = {};

  private adminBound: boolean = false;

  private userClient: ldapjs.Client;

  private userBound: boolean = false;


  constructor(options: ILdapAuthOptions) {
    super();
    defaults(options, {
      searchScope: 'sub',
      bindProperty: 'dn',
      groupSearchScope: 'sub',
      groupDnProperty: 'dn'
    });
    this.options = options;

    if (isEmpty(this.options.url)) {
      throw new Error('LDAP server URL is not defined.');
    }

    if (isEmpty(this.options.searchFilter)) {
      throw new Error('LDAP search filter is not defined.');
    }


    // we currently implement the admin variant throw admin
    //
    // this.ldap = new LdapAuth(options);
    // this.ldap.on('error', this.onError.bind(this));

    this.clients.admin = new LdapClient('admin', this.clientOptions);
    this.clients.user = new LdapClient('user', this.clientOptions);

  }


  get clientOptions() {
    return {
      url: this.options.url,
      tlsOptions: this.options.tlsOptions,
      socketPath: this.options.socketPath,
      log: this.options.log,
      timeout: this.options.timeout,
      connectTimeout: this.options.connectTimeout,
      idleTimeout: this.options.idleTimeout,
      reconnect: this.options.reconnect,
      strictDN: this.options.strictDN,
      queueSize: this.options.queueSize,
      queueTimeout: this.options.queueTimeout,
      queueDisable: this.options.queueDisable
    };
  }

  get bindDN() {
    return this.options.bindDN || (<any>this.options).bindDn || (<any>this.options).adminDn;
  }

  get bindCredentials() {
    return this.options.bindCredentials || (<any>this.options).Credentials || (<any>this.options).adminPassword;
  }

  async findUser(username: string, client: string = 'admin') {
    if (isEmpty(username)) {
      throw new Error('empty username');
    }

    const searchFilter = this.options.searchFilter.replace(/{{username}}/g, LdapAuthPromise.sanitizeInput(username));
    const opts: any = { filter: searchFilter, scope: this.options.searchScope };
    if (this.options.searchAttributes) {
      opts.attributes = this.options.searchAttributes;
    }

    const results = await this.clients[client].search(this.options.searchBase, opts);
    switch (results.length) {
      case 0:
        return null;
      case 1:
        return results[0];
      default:
        throw new Error('unexpected number of matches (' + results.length + ') for "' + username + '" username');
    }
  }

  // TODO find groups


  static sanitizeInput(input: string) {
    return input
      .replace(/\*/g, '\\2a')
      .replace(/\(/g, '\\28')
      .replace(/\)/g, '\\29')
      .replace(/\\/g, '\\5c')
      .replace(/\0/g, '\\00')
      .replace(/\//g, '\\2f');
  }


  async authenticate(username: string, password: string): Promise<any> {
    let user = null, result = null;
    if (isUndefined(password) || password === null || password === '') {
      throw new Error('no password given');
    }

    let error = null;
    try {
      let connected = await this.clients.admin.connect();
      if (!connected) {
        throw new Error('ldap admin client can\'t connect');
      }


      const bound = await this.clients.admin.bind(this.bindDN, this.bindCredentials);
      if (!bound) {
        throw new Error('ldap can\'t bind');
      }

      user = await this.findUser(username);
      if (!user) {
        throw new UserNotFoundError(username);
      }

      connected = await this.clients.user.connect();
      if (!connected) {
        throw new Error('ldap admin user can\'t connect');
      }

      result = await this.clients.user.bind(user[this.options.bindProperty], password);
      // TODO on success read groups

    } catch (e) {
      error = e;
    } finally {
      await Promise.all([this.clients.user.close(), this.clients.admin.close()]).catch(e => {
      });
    }
    if (error) {
      throw error;
    }
    return result ? user : null;
    /*
        return (new Promise<boolean>((resolve, reject) => {
          Log.debug('ldapauth: auth ...');
          this.ldap.authenticate(username, password, async (error: Error | string, result?: any) => {
            Log.debug('ldapauth: authenticate ' + username + ' error: ' + error);
            if (error) {
              reject(error)
            } else {
              resolve(result)
            }
            await this.close();
          });

        }))
        */
  }

  /*
    async close() {
      Log.debug('ldapauth: closeing ...');
      return new Promise((resolve, reject) => {

        if ((<any>this.ldap)._adminClient) {
          (<any>this.ldap)._adminClient.unbind((e: Error) => {
            Log.error(e)
          });
        }
        if ((<any>this.ldap)._userClient) {
          (<any>this.ldap)._userClient.unbind((e: Error) => {
            Log.error(e)
          });
        }
        Log.debug('ldapauth: close');
        resolve();
      });
    }
  */
}
