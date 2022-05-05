import { IEntityRef } from '@allgemein/schema-api';

export interface IEntityResolveOptions {
  namespace?: string;
  selector?: (refs: IEntityRef[]) => IEntityRef;

  /**
   * Selector for id extraction
   *
   * @param ref
   * @param obj
   */
  idSelector?: (ref: IEntityRef, obj: any) => { [key: string]: any };

  // /**
  //  * Selector for id keys extraction
  //  *
  //  * @param ref
  //  * @param obj
  //  */
  // idKeySelector?: (ref: IEntityRef, obj: any, idKeys: { [key: string]: any }) => { [key: string]: any };

  /**
   * Id key which are predefined the check can be optional
   */
  idKeys?: { key: string; optional: boolean }[];
}
