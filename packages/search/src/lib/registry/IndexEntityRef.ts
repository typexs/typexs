import { assign, isEmpty, snakeCase } from 'lodash';
import {
  __NS__,
  AbstractRef,
  ClassRef,
  IBuildOptions,
  IClassRef,
  IEntityRef,
  ILookupRegistry,
  ISchemaRef,
  METADATA_TYPE,
  RegistryFactory
} from '@allgemein/schema-api';
import { IIndexEntityRefOptions } from '../IIndexEntityRefOptions';
import { __CLASS__, C_FLEXIBLE } from '@typexs/base';
import { __ID__, __TYPE__, C_SEARCH_INDEX } from '../Constants';

export class IndexEntityRef extends AbstractRef implements IEntityRef {


  private indexName: string;

  private typeName: string;

  private entityRef: IEntityRef;


  /**
   * constructs reference object for given entity reference and if passed the overriding index name
   *
   * @param entityRef
   * @param indexName
   */
  constructor(entityRef: IEntityRef, indexName?: string, options?: IIndexEntityRefOptions) {
    super('entity', entityRef.getClassRef().name + 'Idx', <any>entityRef.getClassRef(), C_SEARCH_INDEX);
    const classRef = entityRef.getClassRef();
    options = assign(options || {}, { [C_FLEXIBLE]: true });
    this.setOptions(options || {});
    this.typeName = snakeCase(classRef.name);
    if (indexName) {
      this.indexName = snakeCase(indexName);
    } else {
      let schema = entityRef.getClassRef().getOptions('schema', false);
      if (!schema) {
        schema = 'default';
      } else {
        schema = schema.join('--');
      }
      const registry = entityRef.getNamespace();
      this.indexName = snakeCase([registry, schema, this.typeName].filter(x => !!x).join('__'));
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
    return RegistryFactory.get(C_SEARCH_INDEX);
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
    return snakeCase([this.getIndexName(), this.getTypeName()].join('--'));
  }

  getPropertyRefs() {
    return this.entityRef.getPropertyRefs();
  }

  getPropertyRef(name: string) {
    return this.getPropertyRefs().find(p => p.name === name);
  }

  isOf(instance: any): boolean {
    const name = ClassRef.getClassName(instance);
    if (name && (name === this.name || this.getEntityRef().name === name)) {
      return true;
    } else if (instance[__CLASS__] && (instance[__CLASS__] === this.name || this.getEntityRef().name === instance[__CLASS__])) {
      return true;
    } else if (!isEmpty(instance[__ID__]) && instance[__TYPE__] === this.getTypeName()) {
      return true;
    }
    return false;
  }

  build<T>(instance: any, options?: IBuildOptions): T {
    const opts = assign(options || {}, { skipClassNamespaceInfo: true });
    const built = this.entityRef.build(instance, opts);
    if (!options || !options.skipClassNamespaceInfo) {
      built[__CLASS__] = this.name;
      built[__NS__] = this.getNamespace();
    }
    return built as T;
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
