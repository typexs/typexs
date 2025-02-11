import {
  IDBType,
  IStorageRefOptions,
  K_ENTITY_BUILT,
  Log,
  NotSupportedError,
  NotYetImplementedError,
  REGISTRY_TYPEORM,
  TypeOrmStorageRef
} from '@typexs/base';
import {
  Column,
  CreateDateColumn,
  Entity,
  getMetadataArgsStorage,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';
import { SchemaRef } from '../../registry/SchemaRef';
import { EntityRef } from '../../registry/EntityRef';
import { PropertyRef } from '../../registry/PropertyRef';
import { XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE } from '../../Constants';
import { SchemaUtils } from '../../SchemaUtils';
import { ISchemaMapper } from './../ISchemaMapper';
import { IDataExchange } from '../IDataExchange';
import { EntityDefTreeWorker } from '../EntityDefTreeWorker';
import { NameResolver } from './NameResolver';
import { JoinDesc } from '../../descriptors/JoinDesc';
import { ClassRef, IClassRef, IEntityRef, ILookupRegistry, METATYPE_CLASS_REF, RegistryFactory } from '@allgemein/schema-api';
import { ExprDesc } from '@allgemein/expressions';
import { EntityRegistry } from '../../EntityRegistry';
import { MetadataArgsStorage } from 'typeorm/metadata-args/MetadataArgsStorage';
import { C_CLASS_WRAPPED, C_REGULAR } from './Constants';
import { C_TYPEORM } from '@typexs/base/libs/storage/framework/typeorm/Constants';
import { assign, capitalize, clone, defaults, has, isEmpty, isPlainObject } from '@typexs/generic';


// eslint-disable-next-line @typescript-eslint/ban-types
export interface XContext extends IDataExchange<Function> {
  prefix?: string;
}


export class SqlSchemaMapper extends EntityDefTreeWorker implements ISchemaMapper {


  private storageRef: TypeOrmStorageRef;

  private schemaDef: SchemaRef;

  nameResolver: NameResolver = new NameResolver();

  private classCache: any = [];

  private registry: ILookupRegistry;


  constructor(storageRef: TypeOrmStorageRef, schemaDef: SchemaRef) {
    super();
    this.storageRef = storageRef;
    this.schemaDef = schemaDef;
    this.registry = RegistryFactory.get(REGISTRY_TYPEORM);
    if (!this.schemaDef) {
      throw new Error('not schema found for mapper of storage ref "' + storageRef.name + '"');
    }
  }

  getMetadata(): MetadataArgsStorage {
    return getMetadataArgsStorage();
  }

  hasColumn(fn: Function, propertyName: string) {
    return !!this.getMetadata().columns.find(c => c.target === fn && c.propertyName === propertyName);
  }

  isAlreadyColumn(fn: Function, propertyName: string) {
    return !!this.registry.getEntityRefFor(fn).getPropertyRef(propertyName);
  }

  hasEntity(fn: Function, name: string = null) {
    if (name) {
      return !!this.getMetadata().tables.find(c => c.target === fn && c.name === name);
    }
    return !!this.getMetadata().tables.find(c => c.target === fn);
  }


  async initialize() {
    const entities = this.schemaDef.getStorableEntities();
    for (const entity of entities) {
      Log.debug('-> adding ' + entity.name + ' to entity registry');
      const entityClass = await this.walk(entity, null);
      this.addType(entityClass);
    }
    this.clear();
    if (this.storageRef.getOptions().connectOnStartup || this.storageRef.isActive()) {
      await this.storageRef.reload();
    }
  }


  inClassCache(cls: Function) {
    return this.classCache.indexOf(cls) > -1;
  }


  addType(fn: Function) {
    if (!this.isDone(fn)) {
      this.storageRef.addEntityType(fn);
      this.done(fn);
    }
  }


  protected async onEntity(entityDef: EntityRef,
    referPropertyDef?: PropertyRef,
    sources?: IDataExchange<any>): Promise<IDataExchange<any>> {
    const cls = entityDef.getClassRef().getClass();
    if (!this.isDone(cls) && !this.inClassCache(cls) && entityDef.isStorable()) {
      this.classCache.push(cls);
      return super.onEntity(entityDef, referPropertyDef, sources);
    }
    return { next: cls, abort: true };
  }


  async visitEntity(entityDef: EntityRef): Promise<XContext> {
    // TODO check if entities are registered or not
    // register as entity
    // TODO can use other table name! Define an override attribute

    const tName = entityDef.storingName;
    // const entityClass = entityDef.getClassRef().getClass();
    const entityClass = this.createEntityIfNotExists(entityDef, tName);
    return { next: entityClass };
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: XContext): Promise<XContext> {
    return sources;
  }


  visitDataProperty(propertyDef: PropertyRef, sourceDef: EntityRef | ClassRef, sources?: XContext, results?: XContext): void {
    if (propertyDef.isStorable()) {
      const entityClass = results.next;

      // TODO prefix support?
      const hasPrefix = has(results, 'prefix');
      let propName = propertyDef.name;
      let propStoreName = propertyDef.storingName;
      if (hasPrefix) {
        [propName, propStoreName] = this.nameResolver.for(results.prefix, propertyDef);
      }

      this.createColumnIfNotExists(C_REGULAR, entityClass, propName, propertyDef, propStoreName);
    }
  }


  private handleCheckConditionsIfGiven(sourceRef: EntityRef | ClassRef, propertyDef: PropertyRef, targetRef: EntityRef | ClassRef) {
    const condition: ExprDesc = propertyDef.getOptions('cond', null);
    if (condition) {
      const referred = targetRef instanceof EntityRef ? targetRef.getClassRef() : targetRef;
      const referrer = sourceRef instanceof EntityRef ? sourceRef.getClassRef() : sourceRef;
      return condition.validate(EntityRegistry.$(), referred, referrer);
    } else {
      return false;
    }
  }


  private handleJoinDefinitionIfGiven(sourceDef: EntityRef | IClassRef,
    propertyDef: PropertyRef,
    targetRef: EntityRef | IClassRef,
    sources: XContext) {
    const join: JoinDesc = propertyDef.getJoin();

    // create join entity class
    const joinProps = this.schemaDef.getPropertiesFor(join.getJoinRef().getClass());
    const joinClass = this.handleCreateObjectClass(join.getJoinRef(), 'p', targetRef);
    const hasId = joinProps.filter(j => j.isIdentifier()).length > 0;
    if (!hasId) {
      this.createColumnIfNotExists('primary-generated', joinClass, 'id', { name: 'id', type: 'int' });
    }

    joinProps.forEach(prop => {
      const propName = prop.name;
      const propStoreName = prop.storingName;
      this.createColumnIfNotExists(C_REGULAR, joinClass, propName, prop, propStoreName);
    });

    join.validate(
      sourceDef instanceof EntityRef ? sourceDef.getClassRef() : sourceDef,
      propertyDef,
      targetRef instanceof EntityRef ? targetRef.getClassRef() : targetRef);

    if (targetRef instanceof EntityRef) {
      return { next: joinClass };
    }
    return { next: this.handleCreateObjectClass(targetRef) };
  }

  /**
   * Entity -> Property -> Entity
   *
   * @param sourceRef
   * @param propertyRef
   * @param targetRef
   * @param sources
   */
  async visitEntityReference(sourceRef: EntityRef | ClassRef,
    propertyRef: PropertyRef,
    targetRef: EntityRef,
    sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceRef, propertyRef, targetRef)) {
      // if condition is given then no new join table is needed
      return sources;
    } else if (propertyRef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceRef, propertyRef, targetRef, sources);
    } else if (sourceRef instanceof EntityRef) {

      if (propertyRef.isEmbedded()) {
        return this.handleEmbeddedPropertyReference(sourceRef, propertyRef, targetRef, sources);
      } else {
        /**
         * Default variant if nothing else given generate or use p_{propertyName}_{entityName}
         */
        const pName = propertyRef.storingName;
        const clazz = this.handleCreatePropertyClass(propertyRef, pName);
        this.attachPrimaryKeys(sourceRef, propertyRef, clazz);
        this.attachTargetKeys(propertyRef, targetRef, clazz);

        return { next: clazz };
      }
    } else if (sourceRef instanceof ClassRef) {
      if (!propertyRef.isCollection()) {
        this.attachTargetPrefixedKeys(propertyRef.machineName, targetRef, sources.next);
        return sources;
      } else {
        throw new NotYetImplementedError('not supported; entity reference collection in object');
      }
    }
    throw new NotYetImplementedError('entity reference for ' + sourceRef);
  }


  async leaveEntityReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
    entityDef: EntityRef, sources: XContext, visitResult: XContext): Promise<XContext> {
    // const relation: RelationMetadataArgs = {
    //   target: sourceDef.getClass(),
    //   relationType: propertyDef.isCollection() ? 'one-to-many' : 'one-to-one',
    //   propertyName: propertyDef.name,
    //   // propertyType: reflectedType,
    //   isLazy: false,
    //   type: entityDef.getClass(),
    //   inverseSideProperty: () => entityDef.storingName + '.' + propertyDef.,
    //   options: {}
    // };
    // set(propertyDef, 'relation', relation);
    return sources;
  }


  async visitObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
    classRef: ClassRef, sources?: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
    classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitExternalReference(sourceDef: EntityRef | ClassRef, propertyDef: PropertyRef,
    classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: PropertyRef | EntityRef | ClassRef,
    propertyDef: PropertyRef, classRef: ClassRef, sources: XContext): Promise<XContext> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(sourceRef: EntityRef | ClassRef, propertyDef: PropertyRef,
    classRef: ClassRef, sources: XContext): Promise<XContext> {
    if (this.handleCheckConditionsIfGiven(sourceRef, propertyDef, classRef)) {
      // if condition is given then no new join table is needed
      return { next: this.handleCreateObjectClass(classRef) };
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefinitionIfGiven(sourceRef, propertyDef, classRef, sources);
    } else if (propertyDef.isEmbedded()) {
      if (!propertyDef.isCollection()) {
        if (sourceRef instanceof EntityRef) {
          await this.handleEmbeddedPropertyReference(sourceRef, propertyDef, classRef, sources);
          return { next: this.handleCreateObjectClass(classRef) };
        } else if (sourceRef instanceof ClassRef) {
          await this.handleEmbeddedPropertyReference(sourceRef, propertyDef, classRef, sources);
          return { next: this.handleCreateObjectClass(classRef) };
        }
      }
    } else if (sourceRef instanceof EntityRef) {
      const storeClass = this.handleCreatePropertyClass(
        propertyDef, [sourceRef.name, capitalize(propertyDef.name)].filter(x => !isEmpty(x)).join('')
      );
      this.attachPrimaryKeys(sourceRef, propertyDef, storeClass);

      /*
       * a classref can be generated if no name or id property is given
       */
      const targetIdProps = this.schemaDef.getPropertiesFor(classRef.getClass()).filter(p => p.isIdentifier());
      if (targetIdProps.length > 0) {
        this.attachTargetKeys(propertyDef, classRef, storeClass);
        return { next: this.handleCreateObjectClass(classRef) };
      } else {
        // no target identifier present, mark class as dynamic property
        propertyDef.getJoinRef().setOption(C_CLASS_WRAPPED, true);
        return { next: storeClass };
      }
    } else if (sourceRef instanceof ClassRef) {
      if (!propertyDef.isCollection()) {
        return { next: sources.next, prefix: propertyDef.name };
      } else {
        const storeClass = this.handleCreatePropertyClass(propertyDef, capitalize(propertyDef.name) + classRef.className);
        this.attachPropertyPrimaryKeys(storeClass);
        propertyDef.getJoinRef().setOption(C_CLASS_WRAPPED, true);
        return { next: storeClass };
      }
    }
    throw new NotYetImplementedError('object reference for ' + sourceRef);
  }


  async _leaveReference(sourceRef: PropertyRef | EntityRef | IClassRef,
    propertyRef: PropertyRef,
    classRef: IClassRef,
    sources: XContext): Promise<XContext> {
    return sources;
  }


  private handleCreateObjectClass(classRef: IClassRef, prefix: string = 'o', targetRef?: EntityRef | IClassRef) {
    let tName = classRef.storingName;
    if (!classRef.getOptions('name')) {
      tName = [prefix, tName].join('_');
    }
    classRef.storingName = tName;
    // const entityClass = classRef.getClass();
    const entityClass = this.createEntityIfNotExists(classRef, tName);
    // check if an ID exists in class else add one

    if (targetRef) {
      const sourceClass = targetRef.getClass();
      getMetadataArgsStorage().entitySubscribers.filter(s => s.target === sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
      getMetadataArgsStorage().entityListeners.filter(s => s.target === sourceClass).map(s => {
        (<any>s['target']) = entityClass;
      });
    }
    return entityClass;
  }


  private handleCreatePropertyClass(propertyDef: PropertyRef, className: string) {
    propertyDef.joinRef = propertyDef.getRegistry().getClassRefFor(SchemaUtils.clazz(className), METATYPE_CLASS_REF);
    // const storeClass = propertyDef.joinRef.getClass();
    const storingName = propertyDef.storingName;
    return this.createEntityIfNotExists(propertyDef.joinRef, storingName);
  }


  private async handleEmbeddedPropertyReference(sourceDef: PropertyRef | EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    sources: XContext): Promise<XContext> {
    const targetClass = sources.next;
    let propertyNames: string[] = [];
    if (propertyDef.hasIdKeys()) {
      propertyNames = propertyDef.getIdKeys();
    } else {
      propertyNames = [propertyDef.storingName];
    }
    const indexNames: string[] = [];
    let idProps: PropertyRef[] = [];
    if (targetDef instanceof EntityRef) {
      idProps = targetDef.getPropertyRefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(targetDef.getClass()).filter(p => p.isIdentifier());
    }
    if (isEmpty(idProps)) {
      throw new NotYetImplementedError('no primary key is defined on ' + targetDef.machineName);
    }
    idProps.forEach(property => {
      const name = propertyNames.shift();
      indexNames.push(name);
      let targetId, targetName;
      if (propertyDef.hasIdKeys()) {
        [targetId, targetName] = this.nameResolver.for(name);
      } else {
        [targetId, targetName] = this.nameResolver.for(name, property);
      }
      const dataType = this.detectDataTypeFromProperty(property);
      const propDef = assign(dataType, { name: targetName });
      this.createColumnIfNotExists(C_REGULAR, targetClass, targetId, propDef);
    });

    if (!isEmpty(propertyNames)) {
      throw new Error('amount of given reference keys is not equal with primary keys of referred entity');
    }

    if (!isEmpty(indexNames)) {
      Index(indexNames)(<any>{ constructor: targetClass });
    }
    return sources;
  }


  private ColumnDef(property: PropertyRef, name: string, skipIdentifier: boolean = false) {
    if (property.isStorable()) {
      let def = clone(property.getOptions(REGISTRY_TYPEORM) || {});
      const dbType = this.detectDataTypeFromProperty(property);
      def = assign(def, dbType, { name: name });
      if (property.isNullable()) {
        def.nullable = true;
      }

      if (property.isIdentifier() && !skipIdentifier) {
        if (property.isGenerated()) {
          // TODO resolve strategy for generation
          return PrimaryGeneratedColumn(def);
        } else {
          return PrimaryColumn(def);
        }
      } else if (dbType.sourceType === 'date' && dbType.variant === 'updated') {
        return UpdateDateColumn(def);
      } else if (dbType.sourceType === 'date' && dbType.variant === 'created') {
        return CreateDateColumn(def);
      }
      return Column(def);
    }
    return null;
  }


  private createEntityIfNotExists(classRef: IEntityRef | IClassRef, name: string) {
    const entityClass = classRef.getClass();
    if (this.hasEntity(entityClass, name)) {
      return entityClass;
    }

    const opts = classRef.getOptions(C_TYPEORM, {});
    defaults(opts, { name: name });
    Object.defineProperty(entityClass, K_ENTITY_BUILT, { writable: false, value: true });
    Entity(opts)(entityClass);
    this.addType(entityClass);
    return entityClass;
  }


  private createColumnIfNotExists(
    type: 'regular' | 'primary' | 'primary-generated' | 'updated' | 'created',
    targetClass: Function,
    propertyName: string,
    propertyRef?: PropertyRef | any,
    altPropertyName?: string,
    skipIdentifier: boolean = false
  ) {

    if (this.hasColumn(targetClass, propertyName) /* || this.isAlreadyColumn(targetClass, propertyName)*/) {
      return;
    }

    let annotation: any = null;
    const container = { constructor: targetClass };
    if (propertyRef instanceof PropertyRef) {
      annotation = this.ColumnDef(propertyRef, altPropertyName, skipIdentifier);
    } else if (isPlainObject(propertyRef)) {
      switch (type) {
        case 'primary-generated':
          annotation = PrimaryGeneratedColumn(propertyRef);
          break;
        case 'primary':
          annotation = PrimaryColumn(propertyRef);
          break;
        case C_REGULAR:
          annotation = Column(propertyRef);
          break;
        case 'created':
          annotation = CreateDateColumn(propertyRef);
          break;
        case 'updated':
          annotation = UpdateDateColumn(propertyRef);
          break;
      }
    } else {
      throw new NotYetImplementedError();
    }
    if (!annotation) {
      throw new NotSupportedError('annotation can not be empty');
    }
    return annotation(container, propertyName);
  }


  private attachTargetPrefixedKeys(prefix: string, entityDef: EntityRef, refTargetClass: Function) {
    entityDef.getPropertyRefIdentifier().forEach(property => {
      const [targetId, targetName] = this.nameResolver.for(prefix, property);
      this.createColumnIfNotExists(C_REGULAR, refTargetClass, targetId, property, targetName, true);
    });

    if (entityDef.areRevisionsEnabled()) {
      const [targetId, targetName] = this.nameResolver.for(prefix, 'revId');
      this.createColumnIfNotExists(C_REGULAR, refTargetClass, targetId, { name: targetName, type: 'int' });
    }
    // TODO if revision support is enabled for entity then it must be handled also be the property
  }


  private attachTargetKeys(propDef: PropertyRef, entityDef: EntityRef | ClassRef, refTargetClass: Function) {
    const uniqueIndex: string[] = [];

    let idProps = [];
    if (entityDef instanceof EntityRef) {
      idProps = entityDef.getPropertyRefIdentifier();
    } else {
      idProps = this.schemaDef.getPropertiesFor(entityDef.getClass()).filter(p => p.isIdentifier());
    }

    idProps.forEach(property => {
      const [targetId, targetName] = this.nameResolver.forTarget(property);
      this.createColumnIfNotExists(C_REGULAR, refTargetClass, targetId, property, targetName, true);
      uniqueIndex.push(targetId);
    });

    if (entityDef instanceof EntityRef) {

      // TODO if revision support is enabled for entity then it must be handled also be the property
      if (entityDef.areRevisionsEnabled()) {
        const [targetId, targetName] = this.nameResolver.forTarget('revId');
        this.createColumnIfNotExists(C_REGULAR, refTargetClass, targetId, { name: targetName, type: 'int' });
        uniqueIndex.push(targetId);
      }
    }
    Index(uniqueIndex)(refTargetClass);
  }


  private attachPrimaryKeys(entityDef: EntityRef, propDef: PropertyRef, refTargetClass: Function) {
    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists('primary-generated', refTargetClass, 'id', { name: 'id', type: 'int' });

    // TODO maybe put property to
    // this.schemaRef.getRegistry().create(METATYPE_PROPERTY, <IPropertyOptions>{
    //   target: refTargetClass,
    //   identifier: true,
    //   propertyName: 'id',
    //   type: Number
    // });

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'varchar', length: 64 });
    const uniqueIndex = [sourceId];

    // if (propDef.propertyRef && propDef.propertyRef.getClass() === refTargetClass) {
    //   [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
    //   this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, {
    //     name: sourceName,
    //     type: 'varchar',
    //     length: 64
    //   });
    //   uniqueIndex.push(sourceId);
    // }

    // TODO if revision support is enabled for entity then it must be handled also be the property
    entityDef.getPropertyRefIdentifier().forEach(property => {
      const [sourceId, sourceName] = this.nameResolver.forSource(property);
      const dbType = this.detectDataTypeFromProperty(property);
      const def = assign(dbType, { name: sourceName });
      this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, def);
      uniqueIndex.push(sourceId);
    });

    if (entityDef.areRevisionsEnabled()) {
      [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
      this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'int' });
      uniqueIndex.push(sourceId);
    }
    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'int' });
    uniqueIndex.push(sourceId);
    Index(uniqueIndex, { unique: true })(refTargetClass);
  }


  private attachPropertyPrimaryKeys(refTargetClass: Function) {
    // this is the default variant!
    // create an generic id
    this.createColumnIfNotExists('primary-generated', refTargetClass, 'id', { name: 'id', type: 'int' });

    let [sourceId, sourceName] = this.nameResolver.forSource(XS_P_TYPE);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'varchar', length: 64 });
    const uniqueIndex = [sourceId];

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'varchar', length: 64 });
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_PROPERTY_ID);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'int' });
    uniqueIndex.push(sourceId);

    [sourceId, sourceName] = this.nameResolver.forSource(XS_P_SEQ_NR);
    this.createColumnIfNotExists(C_REGULAR, refTargetClass, sourceId, { name: sourceName, type: 'int' });
    uniqueIndex.push(sourceId);

    Index(uniqueIndex, { unique: true })(refTargetClass);
  }


  // fixme workaround
  private getStorageOptions(): IStorageRefOptions {
    return this.storageRef.getOptions();
  }


  private detectDataTypeFromProperty(prop: PropertyRef): IDBType {
    const schemaHandler = this.storageRef.getSchemaHandler();

    if (!schemaHandler.supportsJson()) {
      // handle object as json, mark for serialization
      if (['object', 'array', 'json'].includes(prop.dataType)) {
        return <any>{
          // type: Object,
          type: String,
          stringify: true,
          sourceType: prop.dataType
        };
      }
    }


    let type: IDBType = schemaHandler.translateToStorageType(prop.dataType, prop.getOptions());
    // {type: 'text', sourceType: <JS_DATA_TYPES>prop.dataType};
    if (prop.getOptions(REGISTRY_TYPEORM)) {
      const typeorm = prop.getOptions(REGISTRY_TYPEORM);
      type = assign(type, typeorm);
    }
    return type;
  }

}
