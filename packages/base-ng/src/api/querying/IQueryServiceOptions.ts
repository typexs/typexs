import {STORAGE_REQUEST_MODE} from './Constants';
import {IRoutePointer} from '../backend/IRoutePointer';
import {ILookupRegistry} from '@allgemein/schema-api';

/**
 * Options for query service
 */
export interface IQueryServiceOptions {

  routes: { [k in STORAGE_REQUEST_MODE]: string | IRoutePointer };

  /**
   * define default route in ng
   */
  ngRoutePrefix: string;

  /**
   * Name of the registry
   */
  registryName?: string;

  /**
   * Registry handle from type ILookupRegistry
   */
  registry?: ILookupRegistry;
}
