import {IFindOp, IFindOptions as _IFindOptions} from '@typexs/base';
import {IEntityRef, IPropertyRef} from '@allgemein/schema-api';

export interface IFindOptions extends _IFindOptions {

  /**
   * limit for queries for subelements, default will be 50
   */
  subLimit?: number;

  /**
   * Split conditions in multiple request if a this is reached
   */
  maxConditionSplitingLimit?: number;

  hooks?: {
    afterEntity?: (entityRef: IEntityRef, entities: any[]) => void;
    abortCondition?: (entityRef: IEntityRef, propertyDef: IPropertyRef, results: any[], op: IFindOp<any>) => boolean;
  };
}
