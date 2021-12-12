// import { IEntityRef } from '../registry/IEntityRef';
// import { IPropertyRef } from '../registry/IPropertyRef';
import * as _ from 'lodash';
import { IDataExchange } from './IDataExchange';
import { IClassRef, IEntityRef, IPropertyRef } from '@allgemein/schema-api';

interface IQEntry {
  def: IEntityRef | IPropertyRef | IClassRef;
  refer?: IPropertyRef;
  sources?: IDataExchange<any>;
  result?: IDataExchange<any>;
}


export abstract class EntityDefTreeWorker {

  queue: IQEntry[] = [];

  cache: any[] = [];

  public constructor() {
  }


  clear() {
    this.queue = [];
    this.cache = [];
  }

  isDone(o: any) {
    return this.cache.indexOf(o) !== -1;
  }

  done(o: any) {
    if (!this.isDone(o)) {
      this.cache.push(o);
    }
  }


  abstract visitEntity(entityDef: IEntityRef, propertyDef: IPropertyRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;


  abstract leaveEntity(entityDef: IEntityRef, propertyDef: IPropertyRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;


  protected async onEntity(
    entityDef: IEntityRef,
    referPropertyDef?: IPropertyRef,
    sources?: IDataExchange<any>
  ): Promise<IDataExchange<any>> {

    const def: IQEntry = { def: entityDef, sources: sources, refer: referPropertyDef };
    this.queue.push(def);
    def.result = await this.visitEntity(entityDef, referPropertyDef, sources);
    if (!(_.has(def.result, 'abort') && def.result.abort)) {
      const properties = entityDef.getPropertyRefs();
      await this.walkProperties(properties, def);
    }
    def.result = await this.leaveEntity(entityDef, referPropertyDef, def.result);
    this.queue.pop();

    return def.result;
  }


  // abstract visitObject(entityDef: ClassRef, propertyDef: IPropertyRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;
  //
  // abstract leaveObject(entityDef: ClassRef, propertyDef: IPropertyRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;
  //
  // protected async onObject(
  //   entityDef: ClassRef,
  //   referPropertyDef?: IPropertyRef,
  //   sources?: IDataExchange<any>
  // ): Promise<IDataExchange<any>> {
  //
  //   const def: IQEntry = { def: entityDef, sources: sources, refer: referPropertyDef };
  //   this.queue.push(def);
  //   def.result = await this.visitObject(entityDef, referPropertyDef, sources);
  //   if (!(_.has(def.result, 'abort') && def.result.abort)) {
  //     const properties = entityDef.getPropertyRefs();
  //     await this.walkProperties(properties, def);
  //   }
  //   def.result = await this.leaveObject(entityDef, referPropertyDef, def.result);
  //   this.queue.pop();
  //
  //   return def.result;
  // }

  private async onInternalProperty(propertyDef: IPropertyRef, previous: IQEntry): Promise<void> {
    if (propertyDef.isReference()) {
      if (propertyDef.getTargetRef().hasEntityRef()) {
        await this.onEntityReference(propertyDef, previous);
      } else {
        await this.onObjectReference(propertyDef, previous);
      }
    } else {
      await this.onDataProperty(propertyDef, previous);
    }
  }


  abstract visitDataProperty(propertyDef: IPropertyRef,
    sourceDef: IPropertyRef | IEntityRef | IClassRef,
    sources: IDataExchange<any>, targets: IDataExchange<any>): void;

  onDataProperty(propertyDef: IPropertyRef, previous: IQEntry) {
    this.visitDataProperty(propertyDef, previous.def, previous.sources, previous.result);
  }


  abstract visitEntityReference(
    sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    entityDef: IEntityRef,
    sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveEntityReference(
    sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    entityDef: IEntityRef,
    sources: IDataExchange<any>,
    visitResult: IDataExchange<any>): Promise<IDataExchange<any>>;


  async onEntityReference(property: IPropertyRef, previous: IQEntry): Promise<void> {
    const entityDef = property.getTargetRef().getEntityRef(); // FIXED 210823 Entity();
    // Ignore circular entity relations
    if (!this.isCircular(entityDef)) {

      const visitResult = await this.visitEntityReference(previous.def, property, entityDef, previous.result);
      const status = _.get(visitResult, 'status', null);
      if (visitResult) {
        delete visitResult['status'];
      }

      let result = null;
      if (!(_.has(visitResult, 'abort') && visitResult.abort)) {
        result = await this.onEntity(entityDef, property, visitResult);
      } else {
        result = visitResult;
      }
      if (status) {
        _.set(result, 'status', status);
      }

      await this.leaveEntityReference(previous.def, property, entityDef, result, visitResult);

      if (result) {
        delete result['status'];
      }
    }
  }

  isCircular(sourceDef: IPropertyRef | IEntityRef | IClassRef) {
    const exists = _.find(this.queue, (q: IQEntry) => q.def === sourceDef);
    return exists != null;
  }

  abstract visitObjectReference(sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    classRef: IClassRef,
    sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveObjectReference(sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    classRef: IClassRef,
    sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  private async onObjectReference(property: IPropertyRef, previous: IQEntry): Promise<void> {
    const classDef = property.getTargetRef(); // FIXED 210823 targetRef;
    const def: IQEntry = { def: classDef, sources: previous.result, refer: property };
    this.queue.push(def);
    def.result = await this.visitObjectReference(previous.def, property, classDef, previous.result);
    const status = _.get(def.result, 'status', null);
    if (def.result) {
      delete def.result['status'];
    }

    if (!(_.has(def.result, 'abort') && def.result.abort)) {
      // const properties = EntityRegistry.getIPropertyRefsFor(classDef);
      const properties = classDef.getPropertyRefs() as IPropertyRef[];
      await this.walkProperties(properties, def);
    }
    if (status) {
      _.set(def.result, 'status', status);
    }
    def.result = await this.leaveObjectReference(previous.def, property, classDef, def.result);
    if (def.result) {
      delete def.result['status'];
    }

    this.queue.pop();
  }


  abstract visitExternalReference(sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    classRef: IClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  abstract leaveExternalReference(sourceDef: IPropertyRef | IEntityRef | IClassRef,
    propertyDef: IPropertyRef,
    classRef: IClassRef, sources: IDataExchange<any>): Promise<IDataExchange<any>>;

  // private async onExternalProperty(property: IPropertyRef, previous: IQEntry): Promise<void> {
  //   const classDef = property.IPropertyRef;
  //   const def: IQEntry = {def: classDef, sources: previous.result, refer: property};
  //   this.queue.push(def);
  //   def.result = await this.visitExternalReference(previous.def, property, classDef, previous.result);
  //   const status = _.get(def.result, 'status', null);
  //   if (def.result) {
  //     delete def.result['status'];
  //   }
  //   if (!(_.has(def.result, 'abort') && def.result.abort)) {
  //     // const properties = EntityRegistry.getIPropertyRefsFor(classDef);
  //     const properties = classDef.getIPropertyRefs() as IPropertyRef[];
  //     await this.walkProperties(properties, def);
  //   }
  //   if (status) {
  //     _.set(def.result, 'status', status);
  //   }
  //   def.result = await this.leaveExternalReference(previous.def, property, classDef, def.result);
  //   if (def.result) {
  //     delete def.result['status'];
  //   }
  //   this.queue.pop();
  // }


  async walk(entityDef: IEntityRef, sources?: any[]): Promise<any> {
    const result = await this.onEntity(entityDef, null, { next: sources });
    return result.next;
  }


  async walkProperties(properties: IPropertyRef[], previous: IQEntry) {
    for (const propertyDef of properties) {
      await this.onProperty(propertyDef, previous);
    }
  }


  private async onProperty(propertyDef: IPropertyRef, previous: IQEntry): Promise<any> {
    this.queue.push({ def: propertyDef });
    const res: any = await this.onInternalProperty(propertyDef, previous);
    // if (propertyDef.isAppended()) {
    //   res = await this.onInternalProperty(propertyDef, previous);
    // } else {
    //   // property is declared externally
    //   res = await this.onExternalProperty(propertyDef, previous);
    // }
    this.queue.pop();
    return res;
  }

}


