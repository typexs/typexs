import { ClassType, IEntityRef } from '@allgemein/schema-api';
import { CLS_DEF, IFindOp, XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '@typexs/base';
import { LdapEntityController } from '../LdapEntityController';
import { ILdapFindOptions } from './ILdapFindOptions';
import { C_LDAP } from '../../Constants';
import { defaults } from 'lodash';
import { NotYetImplementedError } from '@allgemein/base';
import { ILdapSearchQuery } from '../ILdapSearchQuery';
import { XS_P_$MAX_SCORE } from '@typexs/search';


export class FindOp<T> implements IFindOp<T> {

  readonly controller: LdapEntityController;

  protected options: ILdapFindOptions;

  private entityType: CLS_DEF<T>;

  private ref: IEntityRef;

  protected findConditions: any;

  protected error: Error = null;

  constructor(controller: LdapEntityController) {
    this.controller = controller;
  }

  getNamespace(): string {
    return C_LDAP;
  }

  getFindConditions() {
    return this.findConditions;
  }

  getOptions() {
    return this.options;
  }

  /**
   * Allow wildcard for search over all
   *
   * @param entityType
   * @param findConditions
   * @param options
   */
  async run(
    entityType: CLS_DEF<T>,
    findConditions?: any | ILdapSearchQuery,
    options?: ILdapFindOptions): Promise<T[]> {
    let results: T[] = [];
    this.entityType = entityType;
    this.ref = this.controller.getStorageRef().getEntityRef(entityType);
    defaults(options, <ILdapFindOptions>{
      limit: 50,
      offset: null,
      sort: null,
      cache: false,
      passResults: false,
      raw: false,
      rawQuery: false
    });
    this.options = options;

    try {

      let recordCount = 0;

      const connection = await this.controller.connect();
      if (connection.isOpened() && connection.isBound()) {
        let baseDn = this.controller.getStorageRef().getOptions().baseDn;
        if (this.options.rawQuery) {
          if (!baseDn && findConditions && findConditions.searchDn) {
            baseDn = findConditions.searchDn;
          }

          if (!baseDn) {
            throw new NotYetImplementedError('no base dn is present.');
          }

          if (!findConditions.sizeLimit) {
            findConditions.sizeLimit = this.options.limit;
          }

          results = await connection.search(baseDn, findConditions);
          recordCount = results.length;
          results = results.map(x => this.ref.build(x, { createAndCopy: true, skipClassNamespaceInfo: true }));

        } else {
          throw new NotYetImplementedError('only raw query currently supported.');
        }

      } else {
        throw new Error('connection to ldap server not established');
      }

      results[XS_P_$COUNT] = recordCount;
      results[XS_P_$OFFSET] = this.options.offset;
      results[XS_P_$LIMIT] = this.options.limit;
    } catch (e) {
      this.error = e;
    } finally {
      this.controller.close();
    }

    if (this.error) {
      throw this.error;
    }
    return results;
  }

  getEntityType(): any {
    return this.entityType;
  }


}


