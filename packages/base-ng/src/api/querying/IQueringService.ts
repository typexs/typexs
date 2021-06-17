import {Observable} from 'rxjs';
import {ILookupRegistry} from '@allgemein/schema-api';


export interface IQueringService {

  /**
   * isReady checks if metadata is loaded and executes callback after
   *
   * @param callback
   */
  isReady(callback: (status: boolean, error: Error) => void): void;

  /**
   * isReady checks if metadata is loaded and publishes state on Observable, returns true if this is the case
   *
   */
  isReady(): Observable<boolean>;

  /**
   * Fires true if fully loaded, else it wait
   */
  isLoaded(): Observable<boolean>;

  getRegistry(): ILookupRegistry;

  get(entityName: string, entityId: any, options?: any): Observable<any>;

  query(entityName: string, query?: any, options?: any): Observable<any>;

  aggregate(entityName: string, aggregate?: any, options?: any): Observable<any>;

  save(entityName: string, entity: any, options?: any): Observable<any>;

  update(entityName: string, entityId: any, entity: any, options?: any): Observable<any>;

  updateByCondition(entityName: string, condition: any, update: any, options?: any): Observable<any>;

  delete(entityName: string, entityId: any, options?: any): Observable<any>;

  deleteByCondition(entityName: string, condition: any, options?: any): Observable<any>;


  getNgUrlPrefix(): string;

}
