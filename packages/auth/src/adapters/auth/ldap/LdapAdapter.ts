import { defaults, get, has, isNull, set } from '@typexs/generic';
import { DefaultUserLogin } from '../../../libs/models/DefaultUserLogin';
import { AbstractAuthAdapter } from '../../../libs/adapter/AbstractAuthAdapter';
import { ILdapAuthOptions } from './ILdapAuthOptions';
import { NestedException } from '@typexs/base';
import { AsyncWorkerQueue, IQueueProcessor } from '@allgemein/queue';
import { AuthDataContainer } from '../../../libs/auth/AuthDataContainer';
import { UserNotFoundError } from '../../../libs/exceptions/UserNotFoundError';
import { constants } from 'os';


export const K_AUTH_LDAP = 'ldap';


const DEFAULTS: ILdapAuthOptions = {

  type: K_AUTH_LDAP,

  url: 'ldap://localhost:389',


  //  uidAttr: 'uid',

  mailAttr: 'mail',

  /**
   * The base DN from which to search for users by username.
   * E.g. ou=users,dc=example,dc=org
   */
  searchBase: 'ou=users,dc=example,dc=org',

  /**
   * LDAP search filter with which to find a user by username, e.g.
   * (uid={{username}}). Use the literal {{username}} to have the
   * given username interpolated in for the LDAP search.
   */
  searchFilter: '(uid={{username}})',

  /**
   * Ldap auth support create on login
   */
  createOnLogin: true,

  /**
   * Ldap auth doesn't support creation of accounts in ldap
   */
  allowSignup: false


  // reconnect: false,

  //  timeout: 1000,

  //  idleTimeout: 100
  // connectTimeout: 5000,


};


export class LdapAdapter extends AbstractAuthAdapter implements IQueueProcessor<AuthDataContainer<DefaultUserLogin>> {

  static clazz: Function;

  type: string = K_AUTH_LDAP;

  // @ts-ignore
  options: ILdapAuthOptions;

  // ldap: any;

  idle: number = 2000;

  timer: any;

  queue: AsyncWorkerQueue<AuthDataContainer<DefaultUserLogin>>;

  abort: boolean = false;

  hasRequirements() {
    try {
      if (!LdapAdapter.clazz) {
        LdapAdapter.clazz = require('./LdapAuthPromise').LdapAuthPromise;
      }
    } catch (ex) {
      return false;
    }
    return true;
  }


  async prepare(opts: ILdapAuthOptions) {
    defaults(opts, DEFAULTS);
    this.queue = new AsyncWorkerQueue<AuthDataContainer<DefaultUserLogin>>(this, { name: 'ldap', concurrent: 5 });
    super.prepare(opts);
  }


  async authenticate(container: AuthDataContainer<DefaultUserLogin>): Promise<boolean> {
    const queueJobRef = this.queue.push(container);
    const queueJob = await queueJobRef.get();
    try {
      await queueJob.done(this.queue);
    } catch (e) {
      if (this.abort) {
        return false;
      }
      // retry 3
      let r = get(container, 'retry', 3);
      if (r > 0) {
        set(container, 'retry', --r);
        return this.authenticate(container);
      } else {
        return false;
      }
    }
    return queueJob.getResult();
  }


  createOnLogin(login: AuthDataContainer<DefaultUserLogin>): boolean {
    const ldapData = login.data;
    let mail = null;
    if (has(ldapData, this.options.mailAttr)) {
      // set mail field @see Auth.ts:createUser
      mail = get(ldapData, this.options.mailAttr);
    }

    if (isNull(login.data) || isNull(mail)) {
      login.addError({
        property: 'mail is not present',
        value: 'mail',
        constraints: { no_mail_address: 'No mail address' }
      });
      return false;
    }

    login.data.mail = mail;
    return true;
  }


  async do(container: AuthDataContainer<DefaultUserLogin>, queue?: AsyncWorkerQueue<any>): Promise<boolean> {
    // clearTimeout(this.timer);

    // if (!this.ldap) {
    const ldap = Reflect.construct(LdapAdapter.clazz, [this.options]);


    container.isAuthenticated = false;
    container.success = container.isAuthenticated;

    try {
      const login = container.instance;
      const user = await ldap.authenticate(login.getIdentifier(), login.getSecret());
      if (user) {
        container.data = user;
        container.isAuthenticated = true;
        container.success = container.isAuthenticated;
      }
    } catch (err) {

      if (err instanceof UserNotFoundError) {
        container.addError({
          property: 'username', // Object's property that haven't pass validation.
          value: 'username', // Value that haven't pass a validation.
          constraints: { // Constraints that failed validation with error messages.
            exists: 'username not found'
          }
        });
      } else if (err instanceof Error) {

        if (/Invalid Credentials/.test((<any>err).lde_message)) {
          // TODO handle error messages in error classes and not here
          container.addError({
            property: 'password', // Object's property that haven't pass validation.
            value: 'password', // Value that haven't pass a validation.
            constraints: { // Constraints that failed validation with error messages.
              exists: 'username or password is wrong.'
            }
          });

        } else if((<any>err).errno && (<any>err).errno === -constants.errno.ECONNREFUSED) {
          this.abort = true;
          throw new NestedException(err, 'ECONNREFUSED');
        } else if((<any>err).errno && (<any>err).errno === -constants.errno.ETIMEDOUT) {
          this.abort = true;
          throw new NestedException(err, 'ETIMEDOUT');
        } else if((<any>err).errno && (<any>err).errno === -constants.errno.ECONNRESET) {
          this.abort = true;
          throw new NestedException(err, 'ECONNRESET');
        } else {
          throw new NestedException(err, 'UNKNOWN');
        }

      } else {
        throw new NestedException(err, 'UNKNOWN');
      }


    } finally {
      // await ldap.close();
      // if(!get(this.options,'reconnect',false)){
      //   await this.ldap;
      // }
      // this.timer = setTimeout(this.disconnect.bind(this), this.idle);
    }
    return container.isAuthenticated;
  }


}
