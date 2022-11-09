import { DataContainer, EntityControllerApi, ISaveOp, ISaveOptions, NotYetImplementedError, TypeOrmConnectionWrapper } from '@typexs/base';
import { EntityDefTreeWorker } from '../EntityDefTreeWorker';
import { EntityController } from '../../EntityController';
import { PropertyRef } from '../../registry/PropertyRef';
import { EntityRef } from '../../registry/EntityRef';
import { __PROPERTY__, NAMESPACE_BUILT_ENTITY, XS_P_PROPERTY, XS_P_PROPERTY_ID, XS_P_SEQ_NR, XS_P_TYPE } from '../../Constants';
import * as _ from 'lodash';
import { assign, cloneDeep, find, get, has, isArray, isEmpty, remove } from 'lodash';
import { SqlHelper } from './SqlHelper';
import { JoinDesc } from '../../descriptors/JoinDesc';
import { EntityRegistry } from '../../EntityRegistry';
import { ObjectsNotValidError } from '../../exceptions/ObjectsNotValidError';
import { ClassRef, IClassRef } from '@allgemein/schema-api';
import { SchemaUtils } from '../../SchemaUtils';
import { ISaveData } from './ISaveData';
import { collectLookupConditions, lookupKey, setTargetInitialForProperty } from './Helper';
import { C_CLASS_WRAPPED, PROP_KEY_TARGET } from './Constants';


export class SqlSaveOp<T> extends EntityDefTreeWorker implements ISaveOp<T> {


  constructor(em: EntityController) {
    super();
    this.entityController = em;
  }

  readonly entityController: EntityController;

  private objects: T[] = [];

  private c: TypeOrmConnectionWrapper;

  private isArray: boolean;

  private options: ISaveOptions;

  getNamespace(): string {
    return NAMESPACE_BUILT_ENTITY;
  }


  visitDataProperty(propertyDef: PropertyRef,
    sourceDef: PropertyRef | EntityRef | IClassRef,
    sources: ISaveData,
    targets: ISaveData): void {
  }


  async visitEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: ISaveData): Promise<ISaveData> {
    const map: number[][] = [];
    const embed = entityDef.getPropertyRefs().filter(p => p.isEmbedded() && !p.isNullable());
    if (!_.isEmpty(embed)) {
      const notNullProps = this.getNotNullablePropertyNames(entityDef.getClass());
      for (const source of sources.next) {
        notNullProps.forEach(notNullProp => {
          if (!_.has(source, notNullProp)) {
            source[notNullProp] = '0';
          }
        });
      }
    }
    const saved: any[] = await this.c.manager.save(entityDef.getClass(), sources.next);
    return { next: saved, map: map };
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: ISaveData): Promise<ISaveData> {
    const embedded = entityDef.getPropertyRefs().filter(p => p.isEmbedded() && !p.isNullable());
    if (!_.isEmpty(embedded)) {
      // save again now with setted values
      await this.c.manager.save(entityDef.object.getClass(), sources.next);

      // cleanup references in object
      let targetName, targetId;

      for (const embed of embedded) {
        const targetIdProps = this.entityController.schema().getPropertiesFor(embed.getTargetClass()).filter(p => p.isIdentifier());
        const refProps = SqlHelper.getEmbeddedPropertyIds(embed);
        for (const target of sources.next) {
          let idx = 0;
          targetIdProps.forEach(prop => {
            const name = refProps[idx++];
            [targetId, targetName] = SqlHelper
              .resolveNameForEmbeddedIds(
                this.entityController.nameResolver(), name, embed, prop);
            delete target[targetId];
          });
        }
      }
    }
    return sources;
  }


  async visitEntityReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef,
    sources?: ISaveData): Promise<ISaveData> {

    let sourceEntityDef: EntityRef;
    let targetObjects: any[] = [];
    let map: number[][] = [];
    let joinObjs: any[] = [];

    // extract property data
    if (sourceDef instanceof EntityRef) {
      sourceEntityDef = sourceDef;
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else if (sourceDef instanceof ClassRef) {
      [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    } else {
      throw new NotYetImplementedError();
    }

    targetObjects = _.uniq(targetObjects);

    if (propertyDef.hasConditions()) {
      const condition = propertyDef.getCondition();
      for (const source of sources.next) {
        const targets = propertyDef.get(source);
        for (const target of targets) {
          condition.applyOn(target, source);
        }
      }
    } else if (propertyDef.hasJoinRef()) {
      // if joinRef is present then a new class must be created
      for (let x = 0; x < sources.next.length; x++) {
        const source = sources.next[x];
        // let localMap = map[x];
        let seqNr = 0;
        let targets = propertyDef.get(source);
        if (targets) {
          if (!_.isArray(targets)) {
            targets = [targets];
          }
        } else {
          targets = [];
          setTargetInitialForProperty(propertyDef, source);
        }

        for (const target of targets) {
          // if (!target) continue;
          const joinObj = propertyDef.joinRef.create(false);
          joinObjs.push(joinObj);
          let [id, name] = this.entityController.nameResolver().forSource(XS_P_TYPE);
          joinObj[id] = sourceEntityDef.machineName;
          sourceEntityDef.getPropertyRefIdentifier().forEach(prop => {
            [id, name] = this.entityController.nameResolver().forSource(prop);
            joinObj[id] = prop.get(source);
          });
          [id, name] = this.entityController.nameResolver().forSource(XS_P_SEQ_NR);
          joinObj[id] = seqNr++;
          joinObj[propertyDef.name] = target;
        }
      }
    } else if (propertyDef.hasJoin()) {
      joinObjs = this.handleJoinDefintionVisit(sourceDef, propertyDef, targetDef, sources);
    } else {
      joinObjs = sources.join;
    }

    // TODO if joinObj is empty, then maybe they are not present in the passing data, but exists in the database

    return {
      next: targetObjects,
      join: joinObjs,
      target: sources.next,
      abort: targetObjects.length === 0
    };
  }


  private handleJoinDefintionVisit(sourceDef: EntityRef | IClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef | IClassRef,
    sources: ISaveData) {
    const joinObjs: any[] = [];

    const joinDef: JoinDesc = propertyDef.getJoin();
    const joinProps = EntityRegistry.$().getPropertyRefsFor(joinDef.getJoinRef());
    const seqNrProp = joinProps.find(p => p.isSequence());

    const LOOKUP_KEY = lookupKey(propertyDef);
    for (let x = 0; x < sources.next.length; x++) {
      const source = sources.next[x];
      let seqNr = 0;
      let joinTargets = propertyDef.get(source);
      if (!joinTargets) {
        continue;
      }
      if (!_.isArray(joinTargets)) {
        joinTargets = [joinTargets];
      }

      // save lookup for removing previous
      const lookup: any = {};
      joinDef.getFrom().cond.applyOn(lookup, source);
      joinDef.condition.applyOn(lookup, source);
      source[LOOKUP_KEY] = lookup;

      for (const joinTarget of joinTargets) {
        const joinObj = joinDef.getJoinRef().create(false);
        joinObjs.push(joinObj);
        joinObj[PROP_KEY_TARGET] = joinTarget;
        //  joinObj[PROP_KEY_LOOKUP] = lookup;
        _.assign(joinObj, lookup);
        if (seqNrProp) {
          joinObj[seqNrProp.name] = seqNr++;
        }
      }
    }
    return joinObjs;
  }


  /**
   * Handles the E - P - E relations
   *
   * Two variants:
   *    -  recreate - remove relations and recreate them again
   *    - lookup_update - lookup for existing relations and update them
   *
   * @param sourceDef
   * @param propertyDef
   * @param targetDef
   * @param sources
   * @param visitResult
   * @private
   */
  private async handleJoinDefintionLeave(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    sources: ISaveData,
    visitResult: ISaveData): Promise<ISaveData> {
    // Two possible variants


    const relationUpdateMode: any = get(this.options, 'relationUpdateMode', 'lookup_update');
    switch (relationUpdateMode) {
      case 'recreate':
        return this.recreateRelationsOverJoinReference(sourceDef, propertyDef, targetDef, sources, visitResult);
      default:
        return this.lookupAndUpdateRelationsOverJoinReference(sourceDef, propertyDef, targetDef, sources, visitResult);
    }
  }

  /**
   * Connect to entities by removing relations first and reconnection after
   *
   *
   * @param sourceDef
   * @param propertyDef
   * @param targetDef
   * @param sources
   * @param visitResult
   */
  async recreateRelationsOverJoinReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    sources: ISaveData,
    visitResult: ISaveData): Promise<ISaveData> {
    const joinDef: JoinDesc = propertyDef.getJoin();
    const clazz = joinDef.getJoinRef().getClass();
    const removeConditions: any[] = collectLookupConditions(propertyDef, visitResult.target);
    // const LOOKUP_KEY = this.getLookupKey(propertyDef);
    // for (const source of visitResult.target) {
    //   if (_.has(source, LOOKUP_KEY)) {
    //     const lookup = source[LOOKUP_KEY];
    //     removeConditions.push(lookup);
    //     delete source[LOOKUP_KEY];
    //   }
    // }

    const em = this.c.manager;

    const promises: Promise<any>[] = [
      this.fetchPreviousEntities(clazz, removeConditions, 'delete')
    ];
    // if (!_.isEmpty(removeConditions)) {
    //   const removeEntityRef = this.c.getStorageRef().getEntityRef(clazz);
    //   const opts: any = {}; // _.clone(this.options);
    //   opts.orSupport = _.isArray(removeConditions);
    //   opts.mode = 'delete';
    //   const execDelete = SqlHelper.execQuery(
    //     this.c, removeEntityRef as EntityRef, null, removeConditions, opts);
    //   promises.push(execDelete);
    // }

    if (!_.isEmpty(visitResult.join)) {
      for (const joinObj of visitResult.join) {
        const target = joinObj[PROP_KEY_TARGET];
        joinDef.getTo().cond.applyReverseOn(joinObj, target);
        delete joinObj[PROP_KEY_TARGET];
      }
      promises.push(em.save(clazz, visitResult.join));
    }

    await Promise.all(promises);

    return sources;

  }


  /**
   * Connect entities by fetching previous relations and updating/inserting or deleting if necessary
   *
   * @param sourceDef
   * @param propertyDef
   * @param targetDef
   * @param sources
   * @param visitResult
   */
  async lookupAndUpdateRelationsOverJoinReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef | ClassRef,
    sources: ISaveData,
    visitResult: ISaveData): Promise<ISaveData> {
    const joinDef: JoinDesc = propertyDef.getJoin();
    const clazz = joinDef.getJoinRef().getClass();
    const lookupConditions: any[] = collectLookupConditions(propertyDef, visitResult.target);

    const em = this.c.manager;
    const previousRelations = await this.fetchPreviousEntities(clazz, lookupConditions);
    const promises = [];

    if (!_.isEmpty(visitResult.join)) {
      for (const joinObj of visitResult.join) {
        const target = joinObj[PROP_KEY_TARGET];
        joinDef.getTo().cond.applyReverseOn(joinObj, target);
        delete joinObj[PROP_KEY_TARGET];
        const fn = (x: any) => _.keys(joinObj).filter(k => !k.startsWith('xs:')).reduce((p: boolean, k) => p && x[k] === joinObj[k], true);
        const found = _.remove(previousRelations, fn).shift();
        if (found) {
          assign(found, joinObj);
          assign(joinObj, found);
        }
      }
      promises.push(em.save(clazz, visitResult.join));
    }
    if (previousRelations.length > 0) {
      // remove old relations
      promises.push(em.remove(previousRelations));
    }

    await Promise.all(promises);

    return sources;

  }


  fetchPreviousEntities(
    clazz: Function,
    lookupConditions: any[], mode: 'select' | 'delete' = 'select'): Promise<any[]> {
    if (!_.isEmpty(lookupConditions)) {
      const removeEntityRef = this.c.getStorageRef().getEntityRef(clazz);
      const opts: any = {}; // _.clone(this.options);
      opts.orSupport = _.isArray(lookupConditions);
      opts.mode = mode;
      return SqlHelper.execQuery(
        this.c,
        removeEntityRef as EntityRef,
        null,
        lookupConditions,
        opts);
    }
    return Promise.resolve([]);
  }


  async saveEntityReference(propertyDef: PropertyRef, targetDef: EntityRef, join: any[]) {
    const klass = propertyDef.joinRef.getClass();
    const ids = SqlHelper.extractKeyableValues(join);

    // find previous results
    let previous: any[] = [];
    if (ids.length > 0) {
      previous = await this.c.manager.find(klass, { where: ids });
    }

    const targetIdProps = targetDef.getPropertyRefIdentifier();
    for (let x = 0; x < join.length; x++) {
      const findIds = ids[x];
      if (findIds && !_.isEmpty(previous)) {
        const prevObj = _.remove(previous, findIds);
        if (!_.isEmpty(prevObj)) {
          join[x] = _.merge(prevObj.shift(), join[x]);
        }
      }

      const joinObj = join[x];
      const target = propertyDef.get(joinObj);
      targetIdProps.forEach(prop => {
        const [targetId] = this.entityController.nameResolver().forTarget(prop);
        joinObj[targetId] = prop.get(target);
      });
    }
    await this.c.manager.save(klass, join);

  }

  // TODO retrieveEntityReference, different ways

  async leaveEntityReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    targetDef: EntityRef,
    sources: ISaveData,
    visitResult: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {
      if (_.isEmpty(visitResult.join)) {
        return sources;
      }
      await this.saveEntityReference(propertyDef, targetDef, visitResult.join);
    } else if (propertyDef.isEmbedded()) {
      // set saved referrer id to base entity
      const targetIdProps = targetDef.getPropertyRefIdentifier();
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (const target of visitResult.target) {
        const source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.entityController.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        });
      }
    } else if (propertyDef.hasJoin()) {
      return this.handleJoinDefintionLeave(sourceDef, propertyDef, targetDef, sources, visitResult);
    } else {

      if (visitResult.join) {

        const refIdProps = targetDef.getPropertyRefIdentifier();

        for (let x = 0; x < visitResult.join.length; x++) {
          const joinObj = visitResult.join[x];
          const target = propertyDef.get(joinObj);
          refIdProps.forEach(prop => {
            const [propId, _x] = this.entityController.nameResolver().for(propertyDef.machineName, prop);
            joinObj[propId] = prop.get(target);
          });
        }
      }
    }
    return sources;
  }


  async visitExternalReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveExternalReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<any> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async visitObjectReference(
    sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef, classRef: ClassRef, sources: ISaveData): Promise<ISaveData> {
    return this._visitReference(sourceDef, propertyDef, classRef, sources);
  }


  async leaveObjectReference(
    sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef, classRef: ClassRef, sources?: ISaveData): Promise<ISaveData> {
    return this._leaveReference(sourceDef, propertyDef, classRef, sources);
  }


  async _visitReference(
    sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef,
    sources: ISaveData): Promise<ISaveData> {
    // eslint-disable-next-line prefer-const
    let [map, targetObjects] = SchemaUtils.extractPropertyObjects(propertyDef, sources.next);
    let joinObjs: any[] = [];


    if (propertyDef.hasConditions()) {
      const notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
      const condition = propertyDef.getCondition();
      for (const source of sources.next) {
        const targets = propertyDef.get(source);
        if (_.isEmpty(targets)) {
          continue;
        }
        if (propertyDef.isCollection()) {
          if (isArray(targets)) {
            for (const target of targets) {
              condition.applyOn(target, source);
              notNullProps.forEach(notNullProp => {
                if (!_.has(target, notNullProp)) {
                  target[notNullProp] = '0';
                }
              });
            }
          } else {
            throw new Error('property value must be an array: ' + JSON.stringify(targets));
          }
        } else {
          condition.applyOn(targets, source);
          notNullProps.forEach(notNullProp => {
            if (!has(targets, notNullProp)) {
              targets[notNullProp] = '0';
            }
          });
        }
      }

      targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);

      const targets: ISaveData = {
        next: targetObjects,
        join: joinObjs,
        map: map,
        abort: targetObjects.length === 0
      };


      return targets;
    } else if (propertyDef.hasJoin()) {

      joinObjs = this.handleJoinDefintionVisit(sourceDef, propertyDef, classRef, sources);
      return {
        next: targetObjects,
        join: joinObjs,
        target: sources.next,
        abort: targetObjects.length === 0
      };
    } else if (propertyDef.hasJoinRef()) {
      //
      // Dynamically create reference
      //
      // joinObjs = this.handleJoinRefVisit(sourceDef, propertyDef, classRef, sources);
      // return {
      //   next: targetObjects,
      //   join: joinObjs,
      //   target: sources.next,
      //   abort: targetObjects.length === 0
      // };
      //

      const targetIdProps = this.entityController.schema()
        .getPropertiesFor(classRef.getClass())
        .filter(p => p.isIdentifier());

      if (!_.isEmpty(targetIdProps)) {
        const notNullProps = this.getNotNullablePropertyNames(classRef.getClass());
        for (const target of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(target, notNullProp)) {
              target[notNullProp] = '0';
            }
          });
        }
        targetObjects = await this.c.manager.save(classRef.getClass(), targetObjects);
      }

      // for E-P-O
      if (sourceDef instanceof EntityRef) {

        const sourceIdProps = sourceDef.getPropertyRefIdentifier();
        const embedProps = this.entityController.schema().getPropertiesFor(classRef.getClass());
        const notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        const LOOKUP_KEY = lookupKey(propertyDef);
        for (const source of sources.next) {
          let seqNr = 0;

          let _targetObjects = propertyDef.get(source);
          if (!_targetObjects) {
            continue;
          }
          if (!_.isArray(_targetObjects)) {
            _targetObjects = [_targetObjects];
          }

          // save lookup for removing previous
          // const lookups
          let id, name;
          const lookup = {};

          [id, name] = this.entityController.nameResolver().forSource(XS_P_TYPE);
          lookup[id] = sourceDef.machineName;

          sourceIdProps.forEach(prop => {
            [id, name] = this.entityController.nameResolver().forSource(prop);
            lookup[id] = prop.get(source);
          });

          source[LOOKUP_KEY] = lookup;


          // build joining relations
          for (const target of _targetObjects) {
            const joinObj = propertyDef.getJoinRef().create(false);
            joinObjs.push(joinObj);

            // set ids for source ref
            assign(joinObj, lookup);

            [id, name] = this.entityController.nameResolver().forSource(XS_P_SEQ_NR);
            joinObj[id] = seqNr++;


            const nullable = _.clone(notNullProps);
            embedProps.forEach(prop => {
              _.remove(nullable, x => x === prop.name);
              joinObj[prop.name] = prop.get(target);
            });

            // if target because of reference to an object
            targetIdProps.forEach(prop => {
              const [targetId] = this.entityController.nameResolver().forTarget(prop);
              joinObj[targetId] = prop.get(target);
            });

            notNullProps.forEach(notNullProp => {
              if (!_.has(joinObj, notNullProp)) {
                joinObj[notNullProp] = '0';
              }
            });
          }
        }

        // FIXED 210827 join will be saved later
        // joinObjs = await this.c.manager.save(propertyDef.joinRef.getClass(), joinObjs);

        const ret: ISaveData = {
          next: targetObjects,
          join: joinObjs,
          target: sources.next,
          map: map,
          abort: targetObjects.length === 0
        };

        return ret;

      } else if (sourceDef instanceof ClassRef) {
        // for O-PO

        // my own property
        const embedProps = this.entityController.schema().getPropertiesFor(classRef.getClass());
        const notNullProps = this.getNotNullablePropertiesForEmbedded(propertyDef, embedProps);

        for (const join of sources.join) {
          let seqNr = 0;
          const targets = propertyDef.get(join);

          const lookup = {};
          let [id, name] = this.entityController.nameResolver().forSource(XS_P_TYPE);
          lookup[id] = sourceDef.machineName;

          [id, name] = this.entityController.nameResolver().forSource(XS_P_PROPERTY);
          lookup[id] = propertyDef.machineName;

          [id, name] = this.entityController.nameResolver().forSource(XS_P_PROPERTY_ID);
          lookup[id] = join.id;

          for (const target of targets) {
            const joinObj = propertyDef.joinRef.create(false);
            joinObj[__PROPERTY__] = join;
            joinObjs.push(joinObj);

            assign(joinObj, lookup);

            [id, name] = this.entityController.nameResolver().forSource(XS_P_SEQ_NR);
            joinObj[id] = seqNr++;


            embedProps.forEach(prop => {
              joinObj[prop.name] = prop.get(target);
            });

            // for initial save we must fill nullables
            notNullProps.forEach(notNullProp => {
              joinObj[notNullProp] = '0';
            });
          }
        }

        // FIXED 210827 join will be saved later
        // joinObjs = await this.c.manager.save(propertyDef.joinRef.getClass(), joinObjs);

        const ret: ISaveData = {
          next: targetObjects,
          join: joinObjs,
          map: map,
          abort: targetObjects.length === 0
        };
        return ret;
      }
    } else if (propertyDef.isEmbedded()) {
      // save targets
      const targetClass = classRef.getClass();
      // TODO save
      const embed = this.entityController.schema()
        .getPropertiesFor(targetClass)
        .filter(p => p.isEmbedded() && !p.isNullable());

      if (!_.isEmpty(embed)) {
        const notNullProps = this.getNotNullablePropertyNames(targetClass);
        for (const source of targetObjects) {
          notNullProps.forEach(notNullProp => {
            if (!_.has(source, notNullProp)) {
              source[notNullProp] = '0';
            }
          });
        }
      }

      joinObjs = await this.c.manager.save(targetClass, targetObjects);

      const ret: ISaveData = {
        next: joinObjs,
        target: sources.next,
        abort: targetObjects.length === 0
      };
      return ret;
    } else {

      // not my own property
      const embedProps = this.entityController.schema().getPropertiesFor(classRef.getClass());

      if (sources.join) {
        for (const join of sources.join) {

          let targets = propertyDef.get(join);
          if (!_.isArray(targets)) {
            targets = [targets];
          }

          if (propertyDef.isCollection()) {
            throw new NotYetImplementedError();
          } else {
            // single entry direct or indirect?
            const target = _.first(targets);
            embedProps.forEach(prop => {
              const [id, name] = this.entityController.nameResolver().for(propertyDef.machineName, prop);
              join[id] = prop.get(target);
            });

          }
        }
        return sources;
      }

    }
    throw new NotYetImplementedError();

  }


  async _leaveReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef,
    sources?: ISaveData): Promise<ISaveData> {
    if (propertyDef.hasJoinRef()) {
      const joinRef = propertyDef.getJoinRef();
      const joinClass = joinRef.getClass();
      // const hasJoin = !_.isEmpty(sources.join);
      const em = this.c.manager;
      const wrapped = joinRef.getOptions(C_CLASS_WRAPPED, false);

      let previousRelations = [];
      const lookupConditions = collectLookupConditions(propertyDef, sources.target);
      // if (!wrapped) {
      try {
        previousRelations = await this.fetchPreviousEntities(joinClass, lookupConditions);
      } catch (e) {

      }

      // }

      // identify removed relations
      if (!isEmpty(sources.join) && !isEmpty(previousRelations)) {
        const toUpdate = remove(previousRelations, x => {
          // remove generated id
          const clone = cloneDeep(x);
          const id = x['id'];
          delete clone['id'];
          const res = find(sources.join, clone);
          if (res) {
            res.id = id;
            return true;
          } else {
            return false;
          }
        });
      }

      if (!isEmpty(previousRelations)) {
        // TODO remove targets if not used
        await em.remove(previousRelations);
      }

      if (!_.isEmpty(sources.join)) {
        // Save join again because new data could be attached!
        const saved: any[] = await this.c.manager.save(joinClass, sources.join);
        // TODO await this.handleJoinRefLeave(sourceDef, propertyDef, classRef, sources, sources);
        return { next: saved };
      }
      // }
    } else if (propertyDef.hasJoin()) {
      const saved: any[] = await this.c.manager.save(classRef.getClass(), sources.next);
      await this.handleJoinDefintionLeave(sourceDef, propertyDef, classRef, sources, sources);
      return { next: saved };
    } else if (propertyDef.isEmbedded()) {

      // set saved referrer id to base entity
      const targetClass = propertyDef.getTargetClass();
      const targetIdProps = this.entityController.schema().getPropertiesFor(classRef.getClass()).filter(p => p.isIdentifier());
      const refProps = SqlHelper.getEmbeddedPropertyIds(propertyDef);
      let targetName, targetId;
      for (const target of sources.target) {
        const source = propertyDef.get(target);
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.entityController.nameResolver(), name, propertyDef, prop);
          target[targetId] = prop.get(source);
        });
      }
      sources.next = await this.c.manager.save(targetClass, sources.next);
      // cleanup help variables
      for (const target of sources.next) {
        let idx = 0;
        targetIdProps.forEach(prop => {
          const name = refProps[idx++];
          [targetId, targetName] = SqlHelper.resolveNameForEmbeddedIds(
            this.entityController.nameResolver(), name, propertyDef, prop);
          delete target[targetId];
        });
      }

    }
    return sources;
  }


  private async saveByEntityDef<T>(entityName: string | EntityRef, objects: T[]): Promise<T[]> {
    const entityDef = _.isString(entityName) ? this.entityController.schema().getEntityRefFor(entityName) : entityName;
    return await this.walk(entityDef as EntityRef, objects);
  }


  prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (_.isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  private async validate() {
    let valid = true;
    await Promise.all(_.map(this.objects, o => new DataContainer(o, EntityRegistry.$())).map(async c => {
      valid = valid && await c.validate();
      c.applyState();
    }));
    return valid;
  }


  async run(object: T | T[], options: ISaveOptions = { validate: true }): Promise<T | T[]> {
    this.isArray = _.isArray(object);
    this.objects = this.prepare(object);
    this.options = options;
    let objectsValid = true;
    if (_.get(options, 'validate', false)) {
      objectsValid = await this.validate();
    }


    let error, results: any[] = null;
    if (objectsValid) {
      await this.entityController.invoker.use(EntityControllerApi).doBeforeSave(this.objects, this);

      const resolveByEntityDef = this.entityController.resolveByEntityDef(this.objects);
      const entityNames = Object.keys(resolveByEntityDef);
      this.c = await this.entityController.storageRef.connect() as TypeOrmConnectionWrapper;

      // start transaction, got to leafs and save
      try {
        results = await this.c.manager.transaction(async em => {
          const promises = [];
          for (const entityName of entityNames) {
            const p = this.saveByEntityDef(entityName, resolveByEntityDef[entityName]);
            promises.push(p);
          }
          return Promise.all(promises);
        });
        results = [].concat(...results);
      } catch (e) {
        error = e;
      } finally {
        await this.c.close();
      }

    } else {
      error = new ObjectsNotValidError(this.objects, this.isArray);
    }

    const result = this.isArray ? this.objects : this.objects.shift();
    await this.entityController.invoker.use(EntityControllerApi).doAfterSave(result, error, this);

    if (error) {
      throw error;
    }


    return result;
  }


  private getNotNullablePropertyNames(clazz: Function) {
    const metadata = this.c.manager.connection.getMetadata(clazz);
    const notNullProps = metadata.ownColumns
      .filter(x => !x.isNullable &&
        !x.propertyName.startsWith('source') && x.propertyName !== 'id')
      .map(x => x.propertyName);
    return notNullProps;
  }


  private getNotNullablePropertiesForEmbedded(propertyDef: PropertyRef, embedProps: PropertyRef[]) {
    const notNullProps = this.getNotNullablePropertyNames(propertyDef.getJoinRef().getClass());
    embedProps.forEach(prop => {
      _.remove(notNullProps, x => x === prop.name);
    });
    return notNullProps;
  }


  getOptions(): ISaveOptions {
    return this.options;
  }

  getObjects(): T[] {
    return this.objects;
  }

  getIsArray(): boolean {
    return this.isArray;
  }


}
