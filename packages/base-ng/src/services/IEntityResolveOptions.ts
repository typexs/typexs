import { IEntityRef } from '@allgemein/schema-api';

export interface IEntityResolveOptions {
  namespace?: string;
  selector?: (refs: IEntityRef[]) => IEntityRef;
}
