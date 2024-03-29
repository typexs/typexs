import { isArray, isString } from 'lodash';
import { EntityDefTreeWorker } from '../EntityDefTreeWorker';
import { EntityRef } from '../../registry/EntityRef';
import { PropertyRef } from '../../registry/PropertyRef';
import { IDataExchange } from '../IDataExchange';
import { EntityController } from '../../EntityController';
import { NAMESPACE_BUILT_ENTITY, XS_P_PREV_ID } from '../../Constants';
import { ClassRef } from '@allgemein/schema-api';
import { EntityControllerApi, IDeleteOp, IDeleteOptions, NotSupportedError, TypeOrmConnectionWrapper } from '@typexs/base';


export type IDeleteData = IDataExchange<any[]>;

export class SqlDeleteOp<T> extends EntityDefTreeWorker implements IDeleteOp<T> {

  readonly em: EntityController;

  private c: TypeOrmConnectionWrapper;

  private objects: any[] = [];

  private entityDepth = 0;


  constructor(em: EntityController) {
    super();
    this.em = em;
  }

  getNamespace(): string {
    return NAMESPACE_BUILT_ENTITY;
  }

  getController(): EntityController {
    return this.em;
  }



  visitDataProperty(propertyDef: PropertyRef, sourceDef: EntityRef | ClassRef, sources: IDeleteData, targets: IDeleteData): void {
  }

  async visitEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: IDeleteData): Promise<IDeleteData> {
    if (this.entityDepth === 0) {
      const ids = entityDef.resolveIds(sources.next);
      await this.c.for(entityDef.getClass()).remove(sources.next);
      sources.next.map((v: any, i: number) => {
        v[XS_P_PREV_ID] = ids[i];
      });
    }
    return sources;
  }


  async leaveEntity(entityDef: EntityRef, propertyDef: PropertyRef, sources: IDeleteData): Promise<IDeleteData> {
    // todo delete
    return sources;
  }

  async visitEntityReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    entityDef: EntityRef, sources: IDeleteData): Promise<IDeleteData> {
    this.entityDepth++;
    return sources;
  }

  leaveEntityReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    entityDef: EntityRef, sources: IDeleteData, visitResult: IDeleteData): Promise<IDeleteData> {
    this.entityDepth--;
    return null;
  }


  visitExternalReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }

  leaveExternalReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return null;
  }


  visitObjectReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return undefined;
  }

  leaveObjectReference(sourceDef: EntityRef | ClassRef,
    propertyDef: PropertyRef,
    classRef: ClassRef, sources: IDeleteData): Promise<IDeleteData> {
    return undefined;
  }


  private prepare(object: T | T[]): T[] {
    let objs: T[] = [];
    if (isArray(object)) {
      objs = object;
    } else {
      objs.push(object);
    }
    return objs;
  }


  private async deleteByEntityDef<T>(entityName: string | EntityRef, objects: T[]): Promise<T[]> {
    const entityDef = isString(entityName) ? this.em.schema().getEntityRefFor(entityName) : entityName;
    return await this.walk(entityDef as EntityRef, objects);
  }


  async run(object: T | T[]): Promise<T | T[] | number | any> {
    const _isArray = isArray(object);

    this.objects = this.prepare(object);

    const resolveByEntityDef = this.em.resolveByEntityDef(this.objects);
    const entityNames = Object.keys(resolveByEntityDef);
    this.c = (await this.em.storageRef.connect() as TypeOrmConnectionWrapper);

    await this.em.invoker.use(EntityControllerApi).doBeforeRemove(this);
    let error;
    try {

      // start transaction, got to leafs and save
      await this.c.getEntityManager().transaction(async em => {
        const promises = [];
        for (const entityName of entityNames) {
          const p = this.deleteByEntityDef(entityName, resolveByEntityDef[entityName]);
          promises.push(p);
        }
        return Promise.all(promises);
      });

      // eslint-disable-next-line no-useless-catch
    } catch (e) {
      error = e;
    } finally {
      await this.c.close();
    }

    await this.em.invoker.use(EntityControllerApi).doAfterRemove(this.objects, error, this);


    if (error) {
      throw error;
    }
    if (!_isArray) {
      return this.objects.shift();
    }
    return this.objects;
  }

  // TODO
  getConditions(): any {
    throw new NotSupportedError('removeing by conditions');
  }

  // TODO
  // @ts-ignore
  getOptions(): IDeleteOptions {
    throw new NotSupportedError('removeing with options');
  }

  // TODO
  getRemovable(): any {
    throw new NotSupportedError('removeing by single class');
  }


}
