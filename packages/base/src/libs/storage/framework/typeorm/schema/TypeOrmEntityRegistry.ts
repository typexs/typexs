import {
  camelCase,
  concat,
  defaults,
  defaultsDeep,
  get,
  has,
  isEmpty,
  isFunction,
  isNumber,
  isObjectLike,
  isPlainObject,
  isString,
  isUndefined,
  keys,
  map,
  snakeCase
} from 'lodash';
import { TypeOrmEntityRef } from './TypeOrmEntityRef';
import { ITypeOrmEntityOptions } from './ITypeOrmEntityOptions';
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import {
  AbstractRef,
  ClassRef,
  DefaultNamespacedRegistry,
  IClassRef,
  IEntityOptions,
  IEntityRef,
  IJsonSchema,
  IJsonSchemaSerializeOptions,
  IJsonSchemaUnserializeOptions,
  IObjectOptions,
  IParseOptions,
  IPropertyOptions,
  ISchemaOptions,
  ISchemaRef,
  JsonSchema,
  LookupRegistry,
  METADATA_TYPE,
  MetadataRegistry,
  METATYPE_CLASS_REF,
  METATYPE_EMBEDDABLE,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  METATYPE_SCHEMA,
  RegistryFactory
} from '@allgemein/schema-api';
import { C_DEFAULT, ClassUtils, NotSupportedError, NotYetImplementedError } from '@allgemein/base';
import { TypeOrmPropertyRef } from './TypeOrmPropertyRef';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage';
import { EmbeddedMetadataArgs } from 'typeorm/metadata-args/EmbeddedMetadataArgs';
import { TypeOrmUtils } from '../TypeOrmUtils';
import { isClassRef } from '@allgemein/schema-api/api/IClassRef';
import {
  __TXS__, C_METADATA,
  C_TYPEORM_COLUMN,
  C_TYPEORM_EMBEDDED,
  C_TYPEORM_REGULAR,
  C_TYPEORM_RELATION,
  REGISTRY_TYPEORM,
  T_TABLETYPE,
  TYPEORM_METADATA_KEYS,
  typeormMetadataKeys
} from '../Constants';
import { isEntityRef } from '@allgemein/schema-api/api/IEntityRef';
import { GeneratedMetadataArgs } from 'typeorm/metadata-args/GeneratedMetadataArgs';
import { Log } from '../../../../logging/Log';
import { getMetadataArgsStorage } from 'typeorm';
import { K_IDENTIFIER, K_NULLABLE } from '../../../Constants';
import { EventEmitter } from 'events';
import { ITypeOrmPropertyOptions } from './ITypeOrmPropertyOptions';
import { createTableTypeOrmOptions } from '../Helper';


const MAP_PROP_KEYS = {
  [K_IDENTIFIER]: 'primary',
  // 'auto': 'generated',
  // 'id': 'primary',
  // 'generated': 'generated',
  'unique': 'unique',
  [K_NULLABLE]: K_NULLABLE,
  'cascade': 'cascade',
  'eager': 'eager'
};

/**
 * Note:
 *
 * - each typeorm table has a direct class representation throw target
 */
export class TypeOrmEntityRegistry extends DefaultNamespacedRegistry implements IJsonSchema {


  // eslint-disable-next-line no-use-before-define
  private static _self: TypeOrmEntityRegistry;

  private emitter = new EventEmitter();


  private metadatastore: MetadataArgsStorage = null;


  constructor(namespace: string = REGISTRY_TYPEORM) {
    super(namespace, { detectUnannotatedProperties: false });
    this.emitter.setMaxListeners(1000);

    try {
      this.metadatastore = getMetadataArgsStorage();
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      for (const key of typeormMetadataKeys) {
        if (this.metadatastore[key][__TXS__]) {
          continue;
        }
        this.metadatastore[key][__TXS__] = true;
        this.metadatastore[key].push = function(...args: any[]) {
          const result = Array.prototype.push.bind(this)(...args);
          self.emitter.emit('metadata_push', key, ...args);
          return result;
        };
        this.metadatastore[key].splice = function(start: number, deletecount?: number) {
          const result = Array.prototype.splice.bind(this)(start, deletecount);
          self.emitter.emit('metadata_splice', key, result, start, deletecount);
          return result;
        };
      }
      this.emitter.on('metadata_push', this.onMetaDataPush.bind(this));
      this.emitter.on('metadata_splice', this.onMetaDataSplice.bind(this));
    } catch (e) {
      Log.error(e);
    }
  }


  static $() {
    if (!this._self) {
      this._self = RegistryFactory.get(REGISTRY_TYPEORM) as TypeOrmEntityRegistry; // new TypeOrmEntityRegistry();
    }
    return this._self;
  }


  static reset() {
    const self = this.$();
    self.reset();
    this._self = null;
    LookupRegistry.reset(REGISTRY_TYPEORM);
  }


  onAdd(context: METADATA_TYPE, options: ITypeOrmEntityOptions | ITypeOrmPropertyOptions | ISchemaOptions | IObjectOptions) {

    if (!this.validNamespace(options)) {
      return;
    }

    const target = options.target;
    const tableExists = target ? this.findTable(x => x.target === target) : null;
    if (context === METATYPE_ENTITY) {
      // check if metadata exists for the entry
      if (!tableExists) {
        this.create(METATYPE_ENTITY, options as ITypeOrmEntityOptions);
        const properties = MetadataRegistry.$()
          .getByContextAndTarget(METATYPE_PROPERTY,
            options.target, 'merge') as ITypeOrmPropertyOptions[];

        for (const property of properties) {
          this.onAdd(METATYPE_PROPERTY, property);
        }
      }
    } else if (context === METATYPE_PROPERTY) {
      // todo check if table is present, else skip processing
      if (tableExists) {
        const exists = [
          this.metadatastore.columns.find(x => x.target === target && x.propertyName === options.propertyName),
          this.metadatastore.embeddeds.find(x => x.target === target && x.propertyName === options.propertyName),
          this.metadatastore.relations.find(x => x.target === target && x.propertyName === options.propertyName)
        ].find(x => !isEmpty(x));

        if (!exists) {
          const properties = MetadataRegistry.$()
            .getByContextAndTarget(METATYPE_PROPERTY,
              options.target, 'merge', options.propertyName) as ITypeOrmPropertyOptions[];
          for (const property of properties) {
            this.create(METATYPE_PROPERTY, property);
          }
        }
      }
    } else if (context === METATYPE_SCHEMA) {
      let find: ISchemaRef = this.find(context, (c: ISchemaRef) => c.name === options.name);
      if (!find) {
        find = this.create(context, options as any);
      }
      if (options.target) {
        const entityRef = this.find(METATYPE_ENTITY, (c: IEntityRef) => c.getClass() === options.target) as IEntityRef;
        if (find && entityRef) {
          this.addSchemaToEntityRef(find, entityRef);
        }
      }
    }
  }

  onUpdate() {

  }

  onRemove(context: METADATA_TYPE, entries: (IEntityOptions | IPropertyOptions | ISchemaOptions | IObjectOptions)[]) {

  }

  reset() {
    this.emitter.removeAllListeners();
    for (const key of typeormMetadataKeys) {
      delete this.metadatastore[key][__TXS__];
      this.metadatastore[key].push = Array.prototype.push.bind(this.metadatastore[key]);
      this.metadatastore[key].splice = Array.prototype.splice.bind(this.metadatastore[key]);
    }
    super.reset();
    // TODO this.lookupRegistry = null;
  }

  onMetaDataPush(key: TYPEORM_METADATA_KEYS, ...args: any[]) {
    let foundEntity = null;

    if (args[0] && args[0].new) {
      // skip processing cause already processed
      delete args[0].new;
      return;
    }

    let embedded: EmbeddedMetadataArgs, columnMetadata: ColumnMetadataArgs, relations: RelationMetadataArgs;

    switch (key) {
      case 'columns':
        columnMetadata = args[0] as ColumnMetadataArgs;
        if (columnMetadata.target) {
          foundEntity = this._find(columnMetadata.target);
        }
        if (foundEntity) {
          const exists = foundEntity.getPropertyRefs()
            .find(x => x.name === columnMetadata.propertyName && x.getClassRef().getClass() === columnMetadata.target);
          if (!exists) {
            this.createPropertyByArgs(C_TYPEORM_COLUMN, columnMetadata, true);
          }
        }
        break;
      case 'embeddeds':
        embedded = args[0] as EmbeddedMetadataArgs;

        if (embedded.target) {
          foundEntity = this._find(embedded.target);
        }
        if (foundEntity) {
          const exists = foundEntity.getPropertyRefs()
            .find(x => x.storingName === embedded.propertyName && x.getClassRef().getClass() === embedded.target);
          if (!exists) {
            this.createPropertyByArgs(C_TYPEORM_EMBEDDED, embedded, true);
          }
        }
        break;
      case 'relations':
        relations = args[0] as RelationMetadataArgs;

        if (relations.target) {
          foundEntity = this._find(relations.target);
        }
        if (foundEntity) {
          const exists = foundEntity.getPropertyRefs()
            .find(x => x.storingName === relations.propertyName && x.getClassRef().getClass() === relations.target);
          if (!exists) {
            this.createPropertyByArgs(C_TYPEORM_RELATION, relations, true);
          }
        }
        break;
      case 'tables':
        // const tableMetadataArgs = args[0] as TableMetadataArgs;
        // foundEntity = this._find(tableMetadataArgs.target);
        // if (!foundEntity) {
        //   this.createEntity(tableMetadataArgs);
        // }
        break;
    }
  }


  onMetaDataSplice(key: TYPEORM_METADATA_KEYS, ...args: any[]) {
    // TODO remove entities
  }


  getGlobal() {
    if (typeof window !== 'undefined') {
      return window;
    } else {
      // NativeScript uses global, not window
      return global;
    }
  }


  private findTable(f: (x: TableMetadataArgs) => boolean) {
    return this.metadatastore.tables.find(f as any);
  }


  register(xsdef: AbstractRef): AbstractRef {
    if (xsdef instanceof TypeOrmEntityRef) {
      return this.add(METATYPE_ENTITY, xsdef);
    } else if (xsdef instanceof TypeOrmPropertyRef) {
      return this.add(METATYPE_PROPERTY, xsdef);
    } else {
      throw new NotYetImplementedError();
    }
  }


  private findTableMetadataArgs(fn: any) {
    let cName: TableMetadataArgs = null;
    if (isString(fn)) {
      cName = this.findTable(table => isString(table.target) ? table.target === fn : table.target.name === fn);
    } else if (isFunction(fn)) {
      cName = this.findTable(table => table.target === fn);
    } else if (isPlainObject(fn)) {
      cName = this.findTable(table => table.target === fn.prototype.constructor);
    } else if (isObjectLike(fn)) {
      const construct = ClassUtils.getFunction(fn);
      cName = this.findTable(table => table.target === construct);
    }
    return cName;
  }


  create<T>(context: string, options: ITypeOrmPropertyOptions | ITypeOrmEntityOptions): T {
    let update = false;
    let target = null;
    let typeOrmOptions: any = null;
    if (context === METATYPE_ENTITY) {
      target = options.target;
      if (!target && options.metadata?.target) {
        target = options.metadata.target;
      }
      typeOrmOptions = this.findTableMetadataArgs(target);
      if (!options.metadata || !options.metadata.target) {
        // coming from unserialization
        if (!typeOrmOptions) {
          typeOrmOptions = createTableTypeOrmOptions(options as ITypeOrmEntityOptions, true);
          options.metadata = typeOrmOptions;
          this.metadatastore.tables.push(typeOrmOptions);
        }
      } else {
        const _keys =  Object.keys(options);
        // entry was reset, metadata are passed but everything other from MetadataRegistry is missing (meaning the annotations)
        if (_keys.length === 1 && _keys.includes(C_METADATA) && target) {
          const entry = MetadataRegistry.$().getByContextAndTarget(METATYPE_ENTITY, target).shift();
          if (entry) {
            // registered by schema-api
            defaults(options, entry);
          } else {
            // registered by typeorm; write name to options if present
            if (typeOrmOptions.name) {
              options.internalName = typeOrmOptions.name;
            }
          }
        }
      }

      const res = new TypeOrmEntityRef(options as ITypeOrmEntityOptions);
      this.register(res);
      const metaSchemaOptionsForEntity = MetadataRegistry.$()
        .getByContextAndTarget(METATYPE_SCHEMA, res.getClass());

      if (metaSchemaOptionsForEntity.length > 0) {
        for (const schemaOptions of metaSchemaOptionsForEntity) {
          this.addSchemaToEntityRef(schemaOptions.name, res);
        }
      } else {
        this.addSchemaToEntityRef(C_DEFAULT, res);
      }
      return res as any;
    } else if (context === METATYPE_PROPERTY) {
      // remove cardinality is checked by property ref

      let generated: GeneratedMetadataArgs = null;
      let tableType = C_TYPEORM_COLUMN;
      let isArray = !isUndefined(options.cardinality) && isNumber(options.cardinality) && options.cardinality !== 1;
      let columnType = C_TYPEORM_REGULAR;
      // correct type for typeorm
      let clsRef: IClassRef = null;
      const definedType = options.type;
      let clsType: Function = options.type;
      if (isString(options.type)) {
        clsType = TypeOrmUtils.getJsObjectType(options.type as any);
        if (!clsType) {
          if (!TypeOrmUtils.isSupportedType(options.type)) {
            // is an local type, so it is a relation
            tableType = C_TYPEORM_RELATION;
            clsRef = ClassRef.find(options.type);
            if (clsRef) {
              clsType = clsRef.getClass();
            } else {
              clsRef = ClassRef.get(options.type, this.namespace);
              clsType = clsRef.getClass(true);
            }
          }
        } else if (clsType === Date) {
          if (options.type === 'date:created') {
            columnType = 'createDate';
          } else if (options.type === 'date:updated') {
            columnType = 'updateDate';
          }
        } else if (clsType === Array) {
          // will be stringified if not supported in storage ref
          isArray = true;
        } else if (clsType === Object) {
          // will be stringified if not supported in storage ref
        }
      } else if (isClassRef(clsType) || isEntityRef(clsType)) {
        clsRef = isEntityRef(clsType) ? clsType.getClassRef() : clsType;
        tableType = C_TYPEORM_RELATION;
        clsType = clsType.getClass();
      } else if (clsType === Array) {
        isArray = true;
        // will be stringified if not supported in storage ref
      } else if (clsType === Object) {
        // will be stringified if not supported in storage ref
      } else {
        tableType = C_TYPEORM_RELATION;
        clsType = options.type;
        // clsRef = this.getClassRefFor(clsType, METATYPE_CLASS_REF);

      }


      tableType = get(options, 'tableType', tableType);
      // const cardinality = options['cardinality'] ? options['cardinality'] : 1;
      delete options['cardinality'];

      switch (tableType) {
        case C_TYPEORM_COLUMN:
          typeOrmOptions = this.metadatastore.columns.find(x => x.target === options.target && x.propertyName === options.propertyName);
          break;
        case C_TYPEORM_EMBEDDED:
          typeOrmOptions = this.metadatastore.embeddeds.find(x => x.target === options.target && x.propertyName === options.propertyName);
          break;
        case C_TYPEORM_RELATION:
          typeOrmOptions = this.metadatastore.relations.find(x => x.target === options.target && x.propertyName === options.propertyName);
          break;
      }

      if (!options.metadata || !options.metadata.target) {
        // coming from unserialization
        // no metadata create default
        if (!typeOrmOptions) {
          typeOrmOptions = {
            new: true,
            target: options.target,
            propertyName: options.propertyName
          };

          if (options.metadata) {
            defaults(typeOrmOptions, options.metadata);
          }
          update = true;
        }

        if (!typeOrmOptions.options) {
          typeOrmOptions.options = {};
        }

        if (!clsType) {
          typeOrmOptions.options.type = definedType;
          typeOrmOptions.options.resolve = true;
          clsType = definedType;
        } else {
          typeOrmOptions.options.type = clsType;
        }

        typeOrmOptions.options.name = snakeCase(typeOrmOptions.propertyName);
        defaults(typeOrmOptions, {
          propertyName: options.propertyName,
          target: options.target
        });

        let reversePropName = null;
        let refIdName = null;
        if (tableType === C_TYPEORM_RELATION && !typeOrmOptions.type) {
          if (!clsRef) {
            throw new Error('class ref for relation target not found');
          }
          typeOrmOptions.type = (type: any) => clsType;
          const ids = clsRef.getPropertyRefs().filter(x => x.isIdentifier());
          if (ids.length === 1) {
            refIdName = ids.shift().name;
            reversePropName = camelCase([(options.target as any).name, options.propertyName].join('_'));
            typeOrmOptions.inverseSideProperty = function(reversePropName) {
              return (x: any) => x[reversePropName];
            }(reversePropName);
          } else {
            throw new NotYetImplementedError('TODO');
          }
        } else if (tableType === C_TYPEORM_COLUMN) {
          typeOrmOptions.mode = columnType;
        }

        if (typeOrmOptions.new) {
          if (tableType === C_TYPEORM_COLUMN) {
            const columnMetadataArgs = <ColumnMetadataArgs>{
              options: {
                type: clsType as any
              }
            };

            // translate keys over MAP_PROP_KEYS to column args
            for (const x of  Object.keys(MAP_PROP_KEYS)) {
              if (has(options, x)) {
                columnMetadataArgs.options[MAP_PROP_KEYS[x]] = options[x];
              }
            }
            defaultsDeep(typeOrmOptions, columnMetadataArgs);
            if (columnMetadataArgs.options.generated || options.generated) {
              generated = {
                target: options.target,
                propertyName: options.propertyName,
                strategy: 'increment'
              };
            }
          } else if (tableType === C_TYPEORM_RELATION) {
            defaultsDeep(typeOrmOptions, <RelationMetadataArgs>{
              type: () => clsType,
              isLazy: false,
              relationType: !isArray ? 'one-to-one' : 'many-to-many',
              options: {
                cascade: true,
                eager: true
              }
            });
          }
        }

        options.tableType = tableType;
        options.metadata = typeOrmOptions;

        if (update) {
          switch (tableType) {
            case C_TYPEORM_COLUMN:
              this.metadatastore.columns.push(typeOrmOptions);
              if (generated) {
                this.metadatastore.generations.push(generated);
              }
              break;
            case C_TYPEORM_EMBEDDED:
              this.metadatastore.embeddeds.push(typeOrmOptions);
              break;
            case C_TYPEORM_RELATION:
              this.metadatastore.relations.push(typeOrmOptions);
              if ((<RelationMetadataArgs>typeOrmOptions).relationType === 'one-to-one') {
                this.metadatastore.joinColumns.push({
                  target: options.target,
                  propertyName: options.propertyName,
                  name: [options.propertyName, refIdName].map(x => snakeCase(x)).join('_')
                });
              } else if ((<RelationMetadataArgs>typeOrmOptions).relationType === 'many-to-many') {
                // const revPropName = camelCase([(options.target as any).name, options.propertyName].join('_'));
                const ids = this.metadatastore.columns.filter(x => x.target === options.target && x.options.primary);
                let idName = null;
                if (ids.length === 1) {
                  idName = ids.shift().propertyName;
                } else {
                  throw new NotYetImplementedError('TODO');
                }
                // TODO handle schema
                const joinTable = {
                  name: snakeCase([(options.target as any).name, options.propertyName].join('_')),
                  target: options.target,
                  propertyName: options.propertyName,
                  joinColumns: [{
                    propertyName: options.propertyName,
                    target: options.target,
                    referencedColumnName: idName
                  }],
                  inverseJoinColumns: [{
                    target: clsType,
                    propertyName: reversePropName,
                    referencedColumnName: refIdName
                  }]
                };
                this.metadatastore.joinTables.push(joinTable);
              }
              break;
          }
        }
      }

      const propRef = new TypeOrmPropertyRef(options as ITypeOrmPropertyOptions);
      this.register(propRef);
      return propRef as any;
    } else if (context === METATYPE_EMBEDDABLE) {
      return this.createEmbeddableForOptions(options as any) as any;
    } else if (context === METATYPE_SCHEMA) {
      return this.createSchemaForOptions(options as any) as any;
    }
    throw new NotSupportedError('');
  }


  createPropertyByArgs(type: T_TABLETYPE,
    args: ColumnMetadataArgs | RelationMetadataArgs | EmbeddedMetadataArgs,
    recursive: boolean = false) {
    const propertyOptions: ITypeOrmPropertyOptions = {
      metadata: args,
      target: args.target as any,
      tableType: type,
      namespace: this.namespace,
      propertyName: args.propertyName
    };

    const propRef = this.create<TypeOrmPropertyRef>(METATYPE_PROPERTY, propertyOptions);
    if (recursive && propRef.isReference()) {
      const classRef = propRef.getTargetRef();
      if (!classRef.getEntityRef()) {
        const metadata = this.findTableMetadataArgs(classRef.getClass());
        if (metadata) {
          this.createEntity(metadata);
        }
      }
    }
    return propRef;
  }


  createEntity(fn: TableMetadataArgs) {
    // check if entity exists?
    const entityOptions: ITypeOrmEntityOptions = {
      metadata: fn
    };
    const entity = this.create<TypeOrmEntityRef>(METATYPE_ENTITY, entityOptions);
    const properties: TypeOrmPropertyRef[] = <TypeOrmPropertyRef[]>concat(
      map(this.metadatastore.columns.filter(c => c.target === fn.target),
        c => this.createPropertyByArgs(C_TYPEORM_COLUMN, c)),
      map(this.metadatastore.filterRelations(fn.target),
        c => this.createPropertyByArgs(C_TYPEORM_RELATION, c))
    );

    map(this.metadatastore.filterEmbeddeds(fn.target),
      c => {
        const exists = properties.find(x => x.storingName === c.propertyName && x.getClass() === c.target);
        if (!exists) {
          const r = this.createPropertyByArgs(C_TYPEORM_EMBEDDED, c);
          properties.push(r);
        }
      });

    properties.filter(p => p.isReference()).map(p => {
      const classRef = p.getTargetRef();
      if (!classRef.hasEntityRef()) {
        const metadata = this.findTableMetadataArgs(classRef.getClass());
        if (metadata) {
          this.createEntity(metadata);
        }
      }
    });
    return entity;
  }


  private _find(instance: any): TypeOrmEntityRef {
    const cName = ClassRef.getClassName(instance);
    return this.getEntityRefByName(cName);
  }


  getEntityRefByName(name: string): TypeOrmEntityRef {
    const _name = snakeCase(name);
    return this.find(METATYPE_ENTITY, (e: TypeOrmEntityRef) =>
      snakeCase(e.getClassRef().name) === _name ||
      e.machineName === _name ||
      e.storingName === _name
    );
  }


  // eslint-disable-next-line @typescript-eslint/ban-types
  getEntityRefFor(instance: string | object | Function, skipNsCheck: boolean = false): TypeOrmEntityRef {
    if (!instance) {
      return null;
    }
    const entityRef = this._find(instance);
    if (entityRef) {
      return entityRef;
    }

    if (this.metadatastore) {
      const metadata = this.findTableMetadataArgs(instance);
      if (metadata) {
        return this.createEntity(metadata);
      }
    }
    return null;
  }

  /**
   * Return all entities in this registry
   */
  getEntityRefs(): TypeOrmEntityRef[] {
    return this.list(METATYPE_ENTITY) as TypeOrmEntityRef[];
  }


  getPropertyRefs(ref: IClassRef | IEntityRef): TypeOrmPropertyRef[] {
    return this.getPropertyRefsFor(ref);
  }

  getPropertyRefsFor(entity: IEntityRef | IClassRef): TypeOrmPropertyRef[] {
    if (entity instanceof TypeOrmEntityRef) {
      return this.filter(METATYPE_PROPERTY,
        (x: TypeOrmPropertyRef) => x.getSourceRef().id() === entity.getClassRef().id());
    } else {
      return this.filter(METATYPE_PROPERTY, (x: TypeOrmPropertyRef) => x.getSourceRef().id() === entity.id());
    }
  }

  add<T>(context: string, entry: T): T {
    return this.getLookupRegistry().add(context, entry);
  }


  fromJsonSchema(json: any, options?: IJsonSchemaUnserializeOptions) {
    return JsonSchema.unserialize(json, defaults(options || {},
      {
        namespace: this.namespace,
        collector: [
          {
            type: METATYPE_PROPERTY,
            key: 'type',
            fn: (key: string, data: any, options: IParseOptions) => {
              const type = ['string', 'number', 'boolean', 'date', 'float', 'array', 'object'];
              const value = data[key];
              if (value && type.includes(value)) {
                const cls = TypeOrmUtils.getJsObjectType(value);
                if (cls === String) {
                  if (data['format'] === 'date' || data['format'] === 'date-time') {
                    return Date;
                  }
                }
                return cls;
              } else if (data['$ref']) {
                const className = data['$ref'].split('/').pop();
                return ClassRef.get(className, this.namespace).getClass(true);
              }
              return ClassRef.get(data[key], this.namespace).getClass(true);
            }
          }
        ]
      })
    );
  }

  toJsonSchema(options?: IJsonSchemaSerializeOptions): any {
    const serializer = JsonSchema.getSerializer(defaults(options || {}, <IJsonSchemaSerializeOptions>{
      ignoreUnknownType: true,
      onlyDecorated: true
    }));
    for (const entityRef of this.getEntityRefs()) {
      serializer.serialize(entityRef);
    }
    return serializer.getJsonSchema();
  }
}
