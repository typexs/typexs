import { IQueringService } from '../api/querying/IQueringService';
import { Observable } from 'rxjs';
import { ILookupRegistry } from '@allgemein/schema-api';

export class TestQueryService implements IQueringService {
  aggregate(entityName: string, aggregate?: any, options?: any): Observable<any> {
    return undefined;
  }

  delete(entityName: string, entityId: any, options?: any): Observable<any> {
    return undefined;
  }

  deleteByCondition(entityName: string, condition: any, options?: any): Observable<any> {
    return undefined;
  }

  get(entityName: string, entityId: any, options?: any): Observable<any> {
    return undefined;
  }

  getNgUrlPrefix(): string {
    return '';
  }

  getRegistry(): ILookupRegistry {
    return undefined;
  }

  isLoaded(): Observable<boolean> {
    return undefined;
  }

  isReady(): Observable<boolean>;
  // eslint-disable-next-line no-dupe-class-members
  isReady(callback: (status: boolean, error: Error) => void): void;
  // eslint-disable-next-line no-dupe-class-members
  isReady(callback?: (status: boolean, error: Error) => void): void | Observable<boolean> {
    return ;
  }

  query(entityName: string, query?: any, options?: any): Observable<any> {
    return undefined;
  }

  save(entityName: string, entity: any, options?: any): Observable<any> {
    return undefined;
  }

  update(entityName: string, entityId: any, entity: any, options?: any): Observable<any> {
    return undefined;
  }

  updateByCondition(entityName: string, condition: any, update: any, options?: any): Observable<any> {
    return undefined;
  }

}
