import { IEntityRef, IJsonSchemaSerializer } from '@allgemein/schema-api';
import { IStorageRefMetadata } from '../lib/storage_api/IStorageRefMetadata';

export type STORAGE_API_CONTROLLER_STATE = 'get' | 'query' | 'save' | 'update' | 'delete';

/**
 * Interface declaration
 */
export interface IStorageAPIController {

  /**
   * Hook allowing modification of storage schema information.
   */
  modifyStorageSchema?(storage: IStorageRefMetadata): void;


  /**
   * Allow to post process early produced results for get, query, save and update calls.
   *
   * @param state - which method called
   * @param entityRef - definition of the entities
   * @param results - can be array or single entity
   * @param callOptions - is a map with => paramName to value
   */
  postProcessResults?(
    state: STORAGE_API_CONTROLLER_STATE,
    entityRef: IEntityRef | IEntityRef[],
    results: any | any[],
    callOptions?: any): void;


  serializationPostProcess(
    src: any,
    dst: any,
    serializer?: IJsonSchemaSerializer): void;


}
