import { STORAGE_REQUEST_MODE } from './Constants';
import { IRoutePointer } from '../backend/IRoutePointer';

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
   * Keys allowed in build info
   */
  allowedBuildKeys?: string[];

  /**
   * Name of the registry
   */
  // registryName?: string;

  /**
   * Registry handle from type ILookupRegistry
   */
  // registry?: ILookupRegistry;
}
