import { ClassType, IEntityRef } from '@allgemein/schema-api';
import { IFindOp } from '@typexs/base';
import { LdapEntityController } from '../LdapEntityController';
import { ILdapFindOptions } from './ILdapFindOptions';
import { C_LDAP } from '../../Constants';


export class FindOp<T> implements IFindOp<T> {

  readonly controller: LdapEntityController;

  protected options: ILdapFindOptions;

  protected entityTypes: (Function | string | ClassType<T>)[];

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

  getEntityType() {
    return this.entityTypes as any;
  }

  getEntityTypes() {
    return this.entityTypes;
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
    entityType: Function | string | ClassType<T> | (Function | string | ClassType<T>)[],
    findConditions?: any,
    options?: ILdapFindOptions): Promise<T[]> {
    const results: any = null;

    // this.entityTypes = isArray(entityType) ? entityType : [entityType];
    // const indexEntityRefs = OpsHelper.getIndexTypes(this.controller, this.entityTypes);
    // options = options || {};
    //
    // this.findConditions = findConditions;
    // let results: T[] = null;
    //
    // defaults(options, <IElasticFindOptions>{
    //   limit: 50,
    //   offset: null,
    //   sort: null,
    //   cache: false,
    //   passResults: false,
    //   raw: false,
    //   rawQuery: false,
    //   onEmptyConditions: 'match_all'
    // });
    //
    // await this.controller.getInvoker().use(IndexElasticApi).onOptions('find', options);
    // this.options = options;
    // await this.controller.getInvoker().use(IndexElasticApi).doBeforeFind(this);
    // results = await this.find(indexEntityRefs, findConditions);
    // await this.controller.getInvoker().use(IndexElasticApi).doAfterFind(results, this.error, this);
    //
    // if (this.error) {
    //   throw this.error;
    // }
    return results;
  }


  private async find(entityRefs: IEntityRef[], findConditions?: any): Promise<T[]> {
    const results: T[] = [];
    return results;
  }

}


