import {IRoutePointer} from './IRoutePointer';
import {IApiCallOptions} from '../../lib/http/IApiCallOptions';
import {Observable} from 'rxjs';
import {IRoute} from './IRoute';
import {BACKEND_CLIENT_STATE} from './Constants';

export interface IBackendClientService {

  check(): Observable<boolean>;

  getState(): Observable<BACKEND_CLIENT_STATE>;

  reloadRoutes(): Observable<IRoute[]>;

  callApi<T>(context: string | IRoutePointer, options?: IApiCallOptions): Observable<T>;

  areRoutesLoaded(): Observable<boolean>;

  addRoute(r: IRoute): void;

  getRoute(name: string, method?: string): IRoute;

}
