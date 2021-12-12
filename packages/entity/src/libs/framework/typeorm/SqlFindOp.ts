import * as _ from 'lodash';
import { assign, get, isArray, isNull, isNumber, isUndefined, keys, remove } from 'lodash';
import { EntityDefTreeWorker } from '../EntityDefTreeWorker';
import { EntityController } from '../../EntityController';
import { EntityControllerApi, IFindOp, NotYetImplementedError, TypeOrmConnectionWrapper } from '@typexs/base';
import { PropertyRef } from '../../registry/PropertyRef';
import { EntityRef } from '../../registry/EntityRef';
import { NAMESPACE_BUILT_ENTITY, XS_P_ABORTED, XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE } from '../../Constants';
import { SqlHelper } from './SqlHelper';
import { JoinDesc } from '../../descriptors/JoinDesc';
import { IFindOptions } from '../IFindOptions';
import { OrderDesc } from '../../../libs/descriptors/OrderDesc';
import { ClassRef, IClassRef, IEntityRef, IPropertyRef, METATYPE_ENTITY } from '@allgemein/schema-api';
import { EntityRegistry } from '../../EntityRegistry';
import { IFindData } from './IFindData';
import { IBinding } from './IBinding';
import { setTargetInitialForProperty, setTargetValueForProperty } from './Helper';
import { C_CLASS_WRAPPED } from './Constants';


export class SqlFindOp<T> extends EntityDefTreeWorker implements IFindOp<T> {

  objectDepth: number = 0;

  entityDepth: number = 0;

  readonly controller: EntityController;

  private connection: TypeOrmConnectionWrapper;

  private options: IFindOptions;

  findConditions: any;

  entityType: any;


  constructor(controller: EntityController) {
    super();
    this.controller = controller;
  }


  private hookAbortCondition: (
    entityRef: EntityRef,
    propertyRef: PropertyRef,
    results: any[],
    op: SqlFindOp<T>) => boolean = (entityRef: EntityRef, propertyRef: PropertyRef, results: any[], op: SqlFindOp<T>) => op.entityDepth > 0;


  private hookAfterEntity: (entityRef: EntityRef, entities: any[]) => void = () => {
  };


  getNamespace(): string {
    return NAMESPACE_BUILT_ENTITY;
  }


  visitDataProperty(propertyRef: PropertyRef,
    sourceRef: PropertyRef | EntityRef | ClassRef,
    sources: IFindData, targets: IFindData): void {
  }

  /**
   * Returns the entities for source.conditions
   */
  async visitEntity(entityRef: EntityRef, propertyRef: PropertyRef, sources: IFindData): Promise<IFindData> {
    // TODO default limit configurable
    const limit = _.get(sources, 'options.limit', propertyRef ? this.options.subLimit : this.options.limit);
    const offset = _.get(sources, 'options.offset', null);
    const sortBy = _.get(sources, 'options.sort', null);

    const opts: IFindOptions & any = {
      maxConditionSplitingLimit: this.options.maxConditionSplitingLimit,
      subLimit: this.options.subLimit
    };
    opts.orSupport = true;
    if (_.isNumber(limit) && !propertyRef) {
      opts.limit = limit;
    }
    if (_.isNumber(offset) && !propertyRef) {
      opts.offset = offset;
    }
    if (!!sortBy && !propertyRef) {
      opts.sort = sortBy;
    }
    const results = await SqlHelper.execQuery(this.connection, entityRef, propertyRef, sources.condition, opts);

    const abort = results.length === 0 || this.hookAbortCondition(entityRef, propertyRef, results, this);
    if (abort) {
      // marked as aborted
      results.forEach((r: any) => {
        r[XS_P_ABORTED] = true;
      });
    }
    return { next: results, abort: abort };
  }


  leaveEntity(entityRef: EntityRef, propertyRef: PropertyRef, sources: any): Promise<any> {
    if (sources.next) {
      this.hookAfterEntity(entityRef, sources.next);
    }
    return sources;
  }


  private async handleJoinDefintionVisit(
    sourceRef: EntityRef | ClassRef,
    propertyRef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    sources: IFindData
  ): Promise<[any[], any[], any[]]> {
    let conditions: any[] = [];
    const _lookups: ((t: any) => boolean)[] = [];
    let results: any[] = [];

    const joinDef: JoinDesc = propertyRef.getJoin();
    // const joinProps = EntityRegistry.getPropertyRefsFor(joinDef.joinRef);

    const mapping = SqlHelper.getTargetKeyMap(joinDef.getJoinRef());

    for (let x = 0; x < sources.next.length; x++) {
      const source = sources.next[x];
      conditions.push(joinDef.for(source, mapping));
      _lookups.push(joinDef.lookup(source));
      source[propertyRef.name] = propertyRef.isCollection() ? [] : null;
    }
    if (!_.isEmpty(conditions)) {
      const opts: any = { maxConditionSplitingLimit: this.options.maxConditionSplitingLimit };
      opts.orSupport = true;
      const entityRef = this.connection.getStorageRef().getEntityRef(joinDef.getJoinRef().getClass()) as EntityRef;
      results = await SqlHelper.execQuery(this.connection, entityRef, null, conditions, opts);
    }

    if (results.length === 0) {
      return [[], [], []];
    }

    const lookups: ((t: any) => boolean)[] = [];
    conditions = [];
    for (let x = 0; x < sources.next.length; x++) {
      const lookup = _lookups[x];
      const source = sources.next[x];
      const joinResults = _.filter(results, lookup);
      source[propertyRef.name] = joinResults;
      if (!_.isEmpty(joinResults)) {
        for (const joinResult of joinResults) {
          const condition = joinDef.getTo().cond.for(joinResult);
          conditions.push(condition);
          lookups.push(joinDef.getTo().cond.lookup(joinResult));
        }
      } else {
      }
    }
    conditions = _.uniqBy(conditions, x => JSON.stringify(x));
    return [conditions, lookups, results];
  }


  private async handleJoinDefinitionLeave(
    sourceRef: EntityRef | ClassRef,
    propertyRef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    objects: any[],
    lookups: any[],
    sources: any[]) {

    return this.handleJoinLeave(sourceRef, propertyRef, targetDef, objects, lookups, sources);
  }

  private async handleJoinLeave(
    sourceRef: IEntityRef | IClassRef,
    propertyRef: IPropertyRef,
    targetDef: IEntityRef | IClassRef,
    objects: any[],
    lookups: any[],
    sources: any[]) {
    for (let x = 0; x < objects.length; x++) {
      const source = objects[x];
      const targets = propertyRef.get(source);
      if (!targets) {
        setTargetInitialForProperty(propertyRef, source);
        continue;
      }

      const results = [];
      for (const target of targets) {
        const lookup = lookups.shift();
        const result = _.find(sources, s => lookup(s));
        if (result) {
          results.push(result);
        }
      }

      setTargetValueForProperty(propertyRef, source, results);
    }
    return sources;
  }

  /**
   * Visiting an EntityReference E-P-E
   *
   * @param sourceRef
   * @param propertyRef
   * @param targetDef
   * @param sources
   */
  async visitEntityReference(
    sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef,
    targetDef: EntityRef,
    sources: IFindData
  ): Promise<IFindData> {
    this.entityDepth++;
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];
    const orderBy: any[] = null;

    if (propertyRef.hasConditions()) {
      const mapping = SqlHelper.getTargetKeyMap(targetDef);

      const conditionDef = propertyRef.getCondition();
      for (const source of sources.next) {
        lookups.push(conditionDef.lookup(source));
        conditions.push(conditionDef.for(source, mapping));
      }

    } else if (propertyRef.hasJoin()) {
      [conditions, lookups, results] = await this.handleJoinDefintionVisit(sourceRef, propertyRef, targetDef, sources);
    } else if (propertyRef.hasJoinRef()) {
      // for generated referring table
      // fetch table data and extract target references
      const sourcePropsIds = this.getIdentifierPropertiesFor(sourceRef);

      const [sourceTypeId, sourceTypeName] = this.controller.nameResolver().forSource(XS_P_TYPE);
      const [sourceSeqNrId, sourceSeqNrName] = this.controller.nameResolver().forSource(XS_P_SEQ_NR);

      const qb = this.connection.manager.getRepository(propertyRef.joinRef.getClass()).createQueryBuilder();

      for (const source of sources.next) {
        const condition: any = {};
        condition[sourceTypeName] = sourceRef.machineName;
        sourcePropsIds.forEach(prop => {
          const [sourceId, sourceName] = this.controller.nameResolver().forSource(prop);
          condition[sourceName] = prop.get(source);
        });

        const query = SqlHelper.conditionToQuery(condition);
        if (!_.isEmpty(query)) {
          qb.orWhere(query);
        }

        if (!_.has(source, propertyRef.name)) {
          setTargetInitialForProperty(propertyRef, source);
        }
      }

      if (propertyRef.hasOrder()) {
        const mapping = SqlHelper.getTargetKeyMap(targetDef);
        propertyRef.getOrder().forEach((o: OrderDesc) => {
          qb.addOrderBy(_.get(mapping, o.key.key, o.key.key), o.asc ? 'ASC' : 'DESC');
        });
      } else {
        qb.orderBy(sourceSeqNrName, 'ASC');
      }

      results = await qb.getMany();

      [lookups, conditions] = this.buildLookupBindingsAndQueryConditionsFor(results, sourceRef, targetDef);

    } else {
      // previous refering table, extract conditions
      const targetIdProps = targetDef.getPropertyRefIdentifier();

      let targetName, targetId;

      if (propertyRef.isEmbedded()) {
        const refProps = SqlHelper.getEmbeddedPropertyIds(propertyRef);
        for (const extJoinObj of sources.next) {
          const condition = {};
          const lookup = {};

          let idx = 0;
          targetIdProps.forEach(prop => {
            const name = refProps[idx++];

            [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
              this.controller.nameResolver(), name, propertyRef, prop);

            condition[prop.storingName] = extJoinObj[targetId];
            lookup[prop.name] = extJoinObj[targetId];
          });

          lookups.push(lookup);
          conditions.push(condition);
        }

      } else {
        for (const extJoinObj of sources.next) {
          const condition = {};
          const lookup = {};

          targetIdProps.forEach(prop => {
            const [targetId, _dummy] = this.controller.nameResolver().for(propertyRef.machineName, prop);
            condition[prop.storingName] = extJoinObj[targetId];
            lookup[prop.name] = extJoinObj[targetId];
          });
          lookups.push(lookup);
          conditions.push(condition);
        }
      }
    }

    if (_.isEmpty(conditions)) {
      return {
        next: [],
        condition: conditions,
        lookup: [],
        join: results,
        abort: conditions.length === 0
      };
    }
    return {
      next: sources.next,
      condition: conditions,
      join: results,
      lookup: lookups,
      abort: conditions.length === 0
    };
  }


  /**
   * Returns results for passen conditions which will be combined by "or".
   * Additionally sort parameter can be passed.
   *
   * @param conditions
   * @param clazz
   * @param sort
   */
  async getResultsForConditions(conditions: any[], clazz: Function, sort: { [key: string]: 'ASC' | 'DESC' } = null) {
    let results: any[] = [];
    if (conditions.length > 0) {
      // fetch the results
      const repo = this.connection.manager.getRepository(clazz);
      const queryBuilder = repo.createQueryBuilder();
      for (const cond of conditions) {
        if (!cond || keys(cond).length === 0) {
          throw new Error('conditions for query are empty ' + JSON.stringify(conditions));
        }
        const query = SqlHelper.conditionToQuery(cond);
        if (!_.isEmpty(query)) {
          queryBuilder.orWhere(query);
        }
      }
      if (keys(sort).length > 0) {
        keys(sort).forEach(k => {
          queryBuilder.addOrderBy(k, sort[k]);
        });
      }
      results = await queryBuilder.getMany();
    }
    return results;
  }

  buildLookupBindingsAndQueryConditionsFor(
    results: any[],
    sourceRef: IEntityRef | IClassRef,
    targetRef: IEntityRef | IClassRef
  ): [IBinding<any, any>[], any[]] {
    const sourcePropsIds = this.getIdentifierPropertiesFor(sourceRef);
    const targetIdProps = this.getIdentifierPropertiesFor(targetRef);
    const lookups: IBinding<any, any>[] = [];
    const conditions = [];
    for (const result of results) {
      const condition: any = {};
      const lookup: IBinding<any, any> = { source: {}, target: {} };

      sourcePropsIds.forEach(prop => {
        lookup.source[prop.name] = prop.get(result);
      });

      targetIdProps.forEach(prop => {
        const [targetId, dummy] = this.controller.nameResolver().forTarget(prop);
        condition[prop.storingName] = result[targetId];
        lookup.target[prop.name] = prop.get(result);
      });

      lookups.push(lookup);
      conditions.push(condition);
    }
    return [lookups, conditions];
  }

  buildLookupBindingsAndQueryConditionsOfJoinRefFor(
    results: any[],
    sourceRef: IEntityRef | IClassRef,
    targetRef: IEntityRef | IClassRef
  ): [IBinding<any, any>[], any[]] {
    const sourcePropsIds = this.getIdentifierPropertiesFor(sourceRef);
    const targetIdProps = this.getIdentifierPropertiesFor(targetRef);
    const [sourceSeqNrId, dummy] = this.controller.nameResolver().forSource(XS_P_SEQ_NR);
    const lookups: IBinding<any, any>[] = [];
    const conditions = [];
    for (const result of results) {
      const condition: any = {};
      const lookup: IBinding<any, any> = {
        source: {},
        target: {}
      };

      if (isNumber(result[sourceSeqNrId])) {
        lookup.sourceSeqNr = result[sourceSeqNrId];
      }

      sourcePropsIds.forEach(prop => {
        const [sourceId] = this.controller.nameResolver().forSource(prop);
        lookup.source[prop.name] = result[sourceId];
      });

      targetIdProps.forEach(prop => {
        const [targetId] = this.controller.nameResolver().forTarget(prop);
        condition[prop.storingName] = result[targetId];
        lookup.target[prop.name] = result[targetId];
      });

      lookups.push(lookup);
      conditions.push(condition);
    }
    return [lookups, conditions];
  }


  getIdentifierPropertiesFor(sourceRef: IEntityRef | IClassRef | EntityRef) {
    let propertyRefs: IPropertyRef[] = null;
    if (sourceRef instanceof EntityRef) {
      propertyRefs = sourceRef.getPropertyRefIdentifier();
    } else if (sourceRef instanceof ClassRef) {
      propertyRefs = this.controller.schema().getPropertiesFor(sourceRef.getClass()).filter(p => p.isIdentifier());
    } else {
      throw new NotYetImplementedError();
    }
    return propertyRefs;
  }

  async leaveEntityReference(
    sourceRef: EntityRef | ClassRef,
    propertyRef: PropertyRef,
    entityRef: EntityRef,
    sources: IFindData,
    visitResult: IFindData
  ): Promise<IFindData> {
    this.entityDepth--;
    if (propertyRef.hasConditions()) {
      for (let i = 0; i < visitResult.next.length; i++) {
        const source = visitResult.next[i];
        const lookup = visitResult.lookup[i];
        const targets = _.filter(sources.next, s => lookup(s));

        setTargetValueForProperty(propertyRef, source, targets);
      }
    } else if (propertyRef.hasJoin()) {
      await this.handleJoinDefinitionLeave(
        sourceRef,
        propertyRef,
        entityRef,
        visitResult.next,
        visitResult.lookup,
        sources.next
      );
    } else if (propertyRef.hasJoinRef()) {
      // my data so handle it
      const sourcePropsIds = this.getIdentifierPropertiesFor(sourceRef);
      const targetIdProps = entityRef.getPropertyRefIdentifier();
      const [sourceTypeId, sourceTypeName] = this.controller.nameResolver().forSource(XS_P_TYPE);

      for (const target of visitResult.next) {
        let lookup: any = {};
        lookup[sourceTypeId] = sourceRef.machineName;
        sourcePropsIds.forEach(prop => {
          const [sourceId, _dummy] = this.controller.nameResolver().forSource(prop);
          lookup[sourceId] = prop.get(target);
        });

        const joinObjs = _.filter(visitResult.join, lookup);
        // _.orderBy(joinObjs,[sourceSeqNrId]);

        const result: any[] = [];
        for (const joinObj of joinObjs) {
          lookup = {};
          targetIdProps.forEach(prop => {
            const [targetId, _dummy] = this.controller.nameResolver().forTarget(prop);
            lookup[prop.name] = joinObj[targetId];
          });
          const res = _.find(sources.next, lookup);
          if (res) {
            result.push(res);
          }
        }

        setTargetValueForProperty(propertyRef, target, result);
      }

    } else if (propertyRef.isEmbedded()) {
      const targetIdProps = entityRef.getPropertyRefIdentifier();
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyRef);
      let targetName, targetId;
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        const joinObj = visitResult.next[x];
        const attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.controller.nameResolver(), name, propertyRef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyRef.name] = attachObj;
      }

    } else {
      // not my table
      // add object to join object
      const [sourceSeqNrId, sourceSeqNrName] = this.controller.nameResolver().forSource(XS_P_SEQ_NR);
      for (let x = 0; x < visitResult.lookup.length; x++) {

        const lookup = visitResult.lookup[x];
        const joinObj = visitResult.next[x];
        const attachObj = _.find(sources.next, lookup);
        const seqNr = joinObj[sourceSeqNrId];

        setTargetValueForProperty(propertyRef, joinObj, attachObj, seqNr);
      }
    }
    return sources;
  }


  visitExternalReference(sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef,
    clsRef: ClassRef, sources: IFindData): Promise<IFindData> {
    return this._visitReference(sourceRef, propertyRef, clsRef, sources);
  }

  leaveExternalReference(sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef,
    classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceRef, propertyRef, classRef, sources);
  }

  async visitObjectReference(sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef,
    classRef: ClassRef, sources: IFindData): Promise<IFindData> {
    return this._visitReference(sourceRef, propertyRef, classRef, sources);
  }

  async leaveObjectReference(sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef,
    classRef: ClassRef, sources: IFindData): Promise<any> {
    return this._leaveReference(sourceRef, propertyRef, classRef, sources);
  }


  private async handleJoinRefOverGeneratedPropertyVisit(
    sourceRef: IEntityRef | IClassRef,
    propertyRef: PropertyRef,
    targetRef: IClassRef,
    sources: IFindData
  ) {
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];
    let sort: any = {};

    // let sourceRefDef: EntityRef = null;
    const joinRef = propertyRef.getJoinRef();
    const wrapped = joinRef.getOptions(C_CLASS_WRAPPED, false);
    const joinClass = joinRef.getClass();

    const [sourceSeqNrId, sourceSeqNrName] = this.controller.nameResolver().forSource(XS_P_SEQ_NR);

    if (sourceRef instanceof EntityRef) {
      const [sourceTypeId, sourceTypeName] = this.controller.nameResolver().forSource(XS_P_TYPE);

      // collect pk from source objects
      const idProperties = sourceRef.getPropertyRefIdentifier();

      for (const object of sources.next) {
        const condition: any = {}, lookup: any = {};
        lookup[sourceTypeId] = sourceRef.machineName;
        condition[sourceTypeName] = sourceRef.machineName;
        idProperties.forEach(x => {
          const [sourceId, sourceName] = this.controller.nameResolver().forSource(x);
          condition[sourceName] = x.get(object);
          lookup[sourceId] = x.get(object);
        });
        lookups.push(lookup);
        conditions.push(condition);
        setTargetInitialForProperty(propertyRef, object);
      }
      sort = { [sourceSeqNrName]: 'ASC' };
    } else if (sourceRef instanceof ClassRef) {
      // for default join variant
      const [sourcePropertyId, sourcePropertyName] = this.controller.nameResolver().forSource(XS_P_PROPERTY_ID);

      for (const object of sources.next) {
        const condition: any = {}, lookup: any = {};

        let [id, name] = this.controller.nameResolver().forSource(XS_P_TYPE);
        lookup[id] = sourceRef.machineName;
        condition[name] = sourceRef.machineName;

        [id, name] = this.controller.nameResolver().forSource(XS_P_PROPERTY);
        lookup[id] = propertyRef.machineName;
        condition[name] = propertyRef.machineName;

        lookup[sourcePropertyId] = object.id;
        condition[sourcePropertyName] = object.id;

        lookups.push(lookup);
        conditions.push(condition);
        setTargetInitialForProperty(propertyRef, object);
      }

      sort = { [sourcePropertyName]: 'ASC', [sourceSeqNrName]: 'ASC' };
    }

    results = await this.getResultsForConditions(conditions, joinClass, sort);

    if (!wrapped) {
      // get results from table
      [lookups, conditions] = this.buildLookupBindingsAndQueryConditionsOfJoinRefFor(results, sourceRef, targetRef);
    } else {
      conditions = [];
      results = results.map(x => {
        const entry = targetRef.create(false);
        assign(entry, x);
        return entry;
      });
    }


    return [conditions, lookups, results];
  }

  private async handleJoinOverGeneratedPropertyLeave(
    sourceRef: IEntityRef | IClassRef,
    propertyRef: PropertyRef,
    classRef: IClassRef,
    sources: IFindData
  ) {

    if (_.isEmpty(sources.target)) {
      return;
    }
    const classProp = this.controller.schema().getPropertiesFor(classRef.getClass());
    const [sourceSeqNrId, sourceSeqNrName] = this.controller.nameResolver().forSource(XS_P_SEQ_NR);

    for (let x = 0; x < sources.lookup.length; x++) {
      const lookup = sources.lookup[x];
      let target = null;
      if (lookup.source && lookup.target) {
        target = _.find(sources.target, lookup.source);
        const attachObj = _.find(sources.next, lookup.target);
        // for (const attachObj of attachObjs) {
        const seqNr = isNumber(lookup.sourceSeqNr) ? lookup.sourceSeqNr : null;

        const newObject = classRef.create(false);
        classProp.forEach(p => {
          newObject[p.name] = p.get(attachObj);
        });
        setTargetValueForProperty(propertyRef, target, newObject, seqNr);
      } else {
        target = sources.target[x];
        const attachObjs = _.filter(sources.next, lookup);
        for (const attachObj of attachObjs) {
          const seqNr = attachObj[sourceSeqNrId];

          const newObject = classRef.create(false);
          classProp.forEach(p => {
            newObject[p.name] = p.get(attachObj);
          });
          setTargetValueForProperty(propertyRef, target, newObject, seqNr);
        }
      }

      if (isArray(target[propertyRef.name])) {
        remove(target[propertyRef.name], x => isNull(x) || isUndefined(x));
      }
    }
  }


  /**
   * Internal method to handle E-P-O or E-P-O over injected property by PropertyOf
   *
   * @param sourceRef
   * @param propertyRef
   * @param classRef
   * @param sources
   * @private
   */
  private async _visitReference(
    sourceRef: EntityRef | ClassRef,
    propertyRef: PropertyRef,
    classRef: ClassRef,
    sources: IFindData
  ): Promise<IFindData> {
    this.objectDepth++;
    let conditions: any[] = [];
    let lookups: any[] = [];
    let results: any[] = [];

    if (propertyRef.hasJoin()) {
      [conditions, lookups, results] = await this.handleJoinDefintionVisit(sourceRef, propertyRef, classRef, sources);
      results = await this.getResultsForConditions(conditions, classRef.getClass());

      return {
        next: results,
        target: sources.next,
        lookup: lookups,
        abort: results.length === 0,
        condition: conditions
      };
    } else if (propertyRef.hasJoinRef()) {
      const joinRef = propertyRef.getJoinRef();
      const wrapped = joinRef.getOptions(C_CLASS_WRAPPED, false);


      [conditions, lookups, results] = await this.handleJoinRefOverGeneratedPropertyVisit(sourceRef, propertyRef, classRef, sources);

      if (!wrapped) {
        const storedClass = wrapped ? joinRef.getClass() : classRef.getClass();
        results = await this.getResultsForConditions(conditions, storedClass);
      } else {

      }

      if (results.length === 0) {
        return { next: [], target: sources.next, lookup: [], abort: true };
      }

      return {
        next: results,
        target: sources.next,
        lookup: lookups,
        abort: results.length === 0
      };
    } else if (propertyRef.isEmbedded()) {
      const targetIdProps = this.controller.schema()
        .getPropertiesFor(
          propertyRef.getTargetClass()
        ).filter(p => p.isIdentifier());
      let targetName, targetId;
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyRef);

      const conditions: any[] = [];
      for (const extJoinObj of sources.next) {
        const condition = {};
        const lookup = {};

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];

          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(this.controller.nameResolver(), name, propertyRef, prop);
          condition[prop.storingName] = extJoinObj[targetId];
          lookup[prop.name] = extJoinObj[targetId];
        });

        lookups.push(lookup);
        conditions.push(condition);
      }
      // TODO macht das hier in einer Schleife Sinn???
      const _results = await this.getResultsForConditions(conditions, propertyRef.getTargetClass());
      if (_results.length === 0) {
        return { next: [], target: sources.next, lookup: [], abort: true };
      }
      return { next: _results, target: sources.next, lookup: lookups, abort: _results.length === 0 };
    } else if (propertyRef.hasConditions()) {

      const mapping = SqlHelper.getTargetKeyMap(classRef);
      const conditions = [];
      // let orderByDef = propertyRef.Condition();
      const conditionDef = propertyRef.getCondition();
      for (const source of sources.next) {
        lookups.push(conditionDef.lookup(source));
        conditions.push(conditionDef.for(source, mapping));
      }

      if (conditions) {
        const refEntityRef = this.connection.getStorageRef().getEntityRef(classRef.getClass());
        const opts: any = {
          maxConditionSplitingLimit: this.options.maxConditionSplitingLimit
        };
        opts.orSupport = true;

        if (propertyRef.hasOrder()) {
          opts.sort = {};
          propertyRef.getOrder().forEach((o: OrderDesc) => {
            opts.sort[o.key.key] = o.asc ? 'asc' : 'desc';
          });
        }
        results = await SqlHelper.execQuery(this.connection, refEntityRef as EntityRef, null, conditions, opts);
      }

      return {
        next: results,
        target: sources.next,
        lookup: lookups,
        abort: results.length === 0,
        condition: conditions
      };
    } else {
      const ret = this.handleInlinePropertyPrefixObject(sources, propertyRef, classRef);
      if (ret !== false) {
        return sources;
      }
    }
    throw new NotYetImplementedError();
  }


  async _leaveReference(sourceRef: EntityRef | ClassRef, propertyRef: PropertyRef, classRef: ClassRef, sources: IFindData): Promise<any> {
    this.objectDepth--;
    if (propertyRef.hasJoin()) {
      if (_.isEmpty(sources.target)) {
        return;
      }

      return this.handleJoinDefinitionLeave(
        sourceRef, propertyRef, classRef,
        sources.target, sources.lookup, sources.next);
    } else if (propertyRef.hasJoinRef()) {

      return this.handleJoinOverGeneratedPropertyLeave(
        sourceRef,
        propertyRef,
        classRef,
        sources
      );


    } else if (propertyRef.isEmbedded()) {
      const targetIdProps = this.controller.schema()
        .getPropertiesFor(propertyRef.getTargetClass())
        .filter(p => p.isIdentifier());

      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyRef);
      let targetName, targetId;
      for (let x = 0; x < sources.lookup.length; x++) {

        const lookup = sources.lookup[x];
        const joinObj = sources.target[x];
        const attachObj = _.find(sources.next, lookup);

        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.controller.nameResolver(), name, propertyRef, prop);
          delete joinObj[targetId];
        });
        joinObj[propertyRef.name] = attachObj;
      }
      return;
    } else if (propertyRef.hasConditions()) {

      for (let i = 0; i < sources.target.length; i++) {
        const target = sources.target[i];
        const lookup = sources.lookup[i];
        const results = _.filter(sources.next, s => lookup(s));

        setTargetValueForProperty(propertyRef, target, results);
      }
      return;
    } else {

      if (_.get(sources, 'status.inline', false)) {
        return;
      }
    }
    throw new NotYetImplementedError();
  }

  /**
   *
   * Example: property speed => Speed {value,unit} is embedded inline as obj.speedValue and obj.speedUnit in the overlying object
   *
   */
  private handleInlinePropertyPrefixObject(sources: IFindData, propertyRef: PropertyRef, classRef: ClassRef) {
    const targetProps = this.controller.schema().getPropertiesFor(classRef.getClass());
    const hasId = targetProps.filter(p => p.isIdentifier()).length > 0;

    if (!hasId) {
      // is embedded in current data record
      for (const join of sources.next) {
        if (propertyRef.isCollection()) {
          throw new NotYetImplementedError();
        } else {
          const target = classRef.create(false);
          targetProps.forEach(prop => {
            const [id, name] = this.controller.nameResolver().for(propertyRef.machineName, prop);
            target[prop.name] = join[id];
            delete join[id];
          });
          join[propertyRef.name] = target;
        }
      }
      _.set(sources, 'status.inline', true);
      return sources;
    }
    return false;
  }


  async run(
    entityType: Function | string,
    findConditions: any = null,
    options?: IFindOptions
  ): Promise<T[]> {
    this.entityType = entityType;
    this.findConditions = findConditions;
    this.connection = (await this.controller.storageRef.connect() as TypeOrmConnectionWrapper);
    const opts = _.clone(options) || {};
    this.options = _.defaults(opts, { limit: 100, subLimit: 100, maxConditionSplitingLimit: 100 });
    this.hookAbortCondition = _.get(options, 'hooks.abortCondition', this.hookAbortCondition);
    this.hookAfterEntity = _.get(options, 'hooks.afterEntity', this.hookAfterEntity);
    const entityRef = EntityRegistry.$().getClassRefFor(entityType, METATYPE_ENTITY).getEntityRef() as EntityRef;
    await this.controller.invoker.use(EntityControllerApi).doBeforeFind(this);

    let result, error;
    try {
      result = await this.onEntity(entityRef, null, <IFindData>{
        next: null,
        condition: findConditions,
        options: options
      });

    } catch (e) {
      error = e;
    }
    await this.connection.close();

    const ret = get(result, 'next', []);
    await this.controller.invoker.use(EntityControllerApi).doAfterFind(ret, error, this);
    if (error) {
      throw error;
    }
    return ret;
  }

  getEntityType() {
    return this.entityType;
  }

  getFindConditions() {
    return this.findConditions;
  }

  getOptions(): IFindOptions {
    return this.options;
  }


}


