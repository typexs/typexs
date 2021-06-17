import {IBackendClientService} from './IBackendClientService';
import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {IApiCallOptions} from '../../lib/http/IApiCallOptions';
import {IRoutePointer} from './IRoutePointer';
import {BACKEND_CLIENT_STATE} from './Constants';
import {IRoute} from './IRoute';

@Injectable()
export class BackendService implements IBackendClientService {

  check(): Observable<boolean> {
    return of(true);
  }

  callApi<T>(context: string | IRoutePointer, options?: IApiCallOptions): Observable<T> {
    return null;
  }

  getState(): Observable<BACKEND_CLIENT_STATE> {
    return of('offline');
  }

  reloadRoutes(force: boolean = false): Observable<IRoute[]> {
    return of([]);
  }

  areRoutesLoaded(): Observable<boolean> {
    return of(true);
  }

  getRoute(name: string, method: string): IRoute {
    return null;
  }

  addRoute(r: IRoute) {
  }
}
