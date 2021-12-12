import { IPropertyRef } from '@allgemein/schema-api';

export interface INameResolver {


  forTarget(property: IPropertyRef | string, prefix?: string): [string, string];

  forSource(property: IPropertyRef | string, prefix?: string): [string, string];

  /**
   * Id is the key for an object, name is the storeage value
   */
  for(prefix: string | IPropertyRef, property?: IPropertyRef | string): [string, string];
}
