import * as _ from 'lodash';
import {
  AbstractRef,
  ClassRef,
  IBuildOptions,
  IClassRef,
  IEntityRef,
  ILookupRegistry,
  ISchemaRef,
  METADATA_TYPE
} from '@allgemein/schema-api';
import { C_INDEX } from '../Constants';
import { IIndexEntityRefOptions } from '../IIndexEntityRefOptions';
import { ClassUtils } from '@allgemein/base';
import { __CLASS__ } from '@typexs/base';

export class IndexEntityRef extends AbstractRef implements IEntityRef {


  indexName: string;

  typeName: string;

  entityRef: IEntityRef;


  /**
   * constructs reference object for given entity reference and if passed the overriding index name
   *
   * @param entityRef
   * @param indexName
   */
  constructor(entityRef: IEntityRef, indexName?: string, options?: IIndexEntityRefOptions) {
    super('entity', entityRef.name + 'Idx', <any>entityRef.getClassRef(), C_INDEX);
    this.setOptions(options || {});
    this.typeName = _.snakeCase(entityRef.name);
    if (indexName) {
      this.indexName = _.snakeCase(indexName);
    } else {
      let schema = (<ClassRef>entityRef.getClassRef()).getOptions('schema', false);
      if (!schema) {
        schema = 'default';
      }
      const registry = entityRef.getRegistry().getLookupRegistry().getNamespace();
      this.indexName = _.snakeCase([registry, schema, this.typeName].filter(x => !!x).join('__'));
    }
    this.entityRef = entityRef;
  }


  getSchemaRefs(): ISchemaRef | ISchemaRef[] {
    throw new Error('Method not implemented.');
  }

  getClassRefFor(object: string | Function | IClassRef, type: METADATA_TYPE): IClassRef {
    throw new Error('Method not implemented.');
  }

  getRegistry(): ILookupRegistry {
    throw new Error('Method not implemented.');
  }

  getTypeName() {
    return this.typeName;
  }

  getIndexName() {
    return this.indexName;
  }

  getEntityRef() {
    return this.entityRef;
  }

  id(): string {
    return _.snakeCase([this.getIndexName(), this.getTypeName()].join('--'));
  }

  getPropertyRefs() {
    return this.entityRef.getPropertyRefs();
  }

  getPropertyRef(name: string) {
    return this.getPropertyRefs().find(p => p.name === name);
  }

  isOf(instance: any): boolean {
    const name = ClassUtils.getClassName(instance);
    if (name && (name === this.name || this.getEntityRef().name === name)) {
      return true;
    } else if (instance[__CLASS__] && (instance[__CLASS__] === this.name || this.getEntityRef().name === instance[__CLASS__])) {
      return true;
    } else if (!_.isEmpty(instance['__id']) && instance['__type'] === this.getTypeName()) {
      return true;
    }
    return false;
  }

  build<T>(instance: any, options?: IBuildOptions): T {
    return this.entityRef.build(instance, options);
  }

  create<T>(): T {
    return this.entityRef.create();
  }


  // toJson(follow?: boolean): any {
  //   const json = super.toJson();
  //   const ref = this.entityRef.toJson(follow);
  //   json.properties = ref.properties;
  //   delete ref.properties;
  //   json.indexName = this.indexName;
  //   json.typeName = this.typeName;
  //   json.entityRef = ref;
  //   return json;
  // }

}
