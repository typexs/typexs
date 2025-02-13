import { defaults, get, has, isArray, isArrayLike, isBoolean, isEmpty, isNumber, isObjectLike, isString, isUndefined, keys } from 'lodash';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { API_CTRL_SERVER_PING, API_CTRL_SERVER_ROUTES } from '@typexs/server/libs/Constants';
import { catchError, filter, first, mergeMap, tap } from 'rxjs/operators';
import { IBackendClientService } from '../api/backend/IBackendClientService';
import { MessageService } from '../messages/message.service';
import { BACKEND_CLIENT_STATE } from '../api/backend/Constants';
import { IRoutePointer } from '../api/backend/IRoutePointer';
import { IApiCallOptions } from '../lib/http/IApiCallOptions';
import { IHttpRequestOptions } from '../lib/http/IHttpRequestOptions';
import { UrlHelper } from '../lib/UrlHelper';
import { Log } from '../lib/log/Log';
import { LogMessage } from '../messages/types/LogMessage';
import { ErrorHelper } from '../lib/ErrorHelper';
import { MessageChannel } from '../messages/MessageChannel';
import { CryptUtils } from '@allgemein/base';
import { IRoute } from '../api/backend/IRoute';

/**
 * The primary communication handle to the backend
 *
 * - handles HTTP Requests to the backend, loads allowed routes
 */
@Injectable()
export class HttpBackendService implements IBackendClientService {


  /**
   * Initialize with
   *
   * @param http
   * @param messageService
   */
  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {
    this.logChannel = messageService.getLogService();
    // this.state.subscribe(x => Log.debug('backend state changed ' + x));
  }

  api = '/api';

  private serverTime: Date;

  private state: BehaviorSubject<BACKEND_CLIENT_STATE> = new BehaviorSubject<BACKEND_CLIENT_STATE>('initial');

  // private loading: BehaviorSubject<number> = new BehaviorSubject<boolean>(false)<;

  private routesLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private activeCount$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  private routes: IRoute[];

  private logChannel: MessageChannel<LogMessage>;

  private requestCache: { [k: string]: Subject<any> } = {};

  // private activeCount = 0;


  /**
   * Test if backend is alive
   */
  ping() {
    return this.get(this.apiUrl(API_CTRL_SERVER_PING))
      .pipe(
        tap(
          value => {
            if (value && has(value, 'time')) {
              this.serverTime = new Date(get(value, 'time'));
              this.state.next('online');
            } else {
              this.state.next('inactive');
            }
          },
          error => {
            this.state.next('offline');
            // handle errors for example unreachable
          })
      );
  }

  /**
   * Return the current state of service like if it is connected (online) or not offline.
   */
  getState() {
    return this.state;
  }

  getActiveCountValue() {
    return this.activeCount$.getValue();
  }

  getActiveCount() {
    return this.activeCount$;
  }

  areRoutesLoaded(): Observable<boolean> {
    return this.routesLoaded.asObservable();
  }

  /**
   * Reload route informations from backend, this can happen
   */
  reloadRoutes(force: boolean = false) {
    const obs = new Subject<IRoute[]>();

    if (!force && (this.state.getValue() === 'offline' || this.state.getValue() === 'initial')) {
      setTimeout(() => {
        obs.next([]);
        obs.complete();
      }, 5);
    } else {
      if (this.routesLoaded.getValue() === false && !isUndefined(this.routes)) {
        // load only once, others should wait
        this.routesLoaded
          .pipe(filter(x => x))
          .pipe(first())
          .subscribe(x => {
            obs.next(this.routes);
          }, error => {
            obs.error(error);
          }, () => {
            obs.complete();
          });
        return obs;
      }
      this.routesLoaded.next(false);
      this.routes = [];

      this.state.next('loading');
      this.get(this.apiUrl(API_CTRL_SERVER_ROUTES)).subscribe((routes: IRoute[]) => {
        this.routes = routes;
        this.state.next('online');
        this.routesLoaded.next(true);
        obs.next(this.routes);
      }, error => {
        this.state.next('inactive');
        obs.error(error);
      }, () => {
        obs.complete();
      });
    }
    return obs.asObservable();
  }


  check() {
    const obs = new Subject<boolean>();
    this.ping().subscribe(
      x => {
        const ping = this.state.getValue();
        if (ping === 'offline') {
          this.resetRoutes(true);
          obs.next(false);
          obs.complete();
        } else if (ping === 'online') {
          this.reloadRoutes().subscribe(
            value => {
              obs.next(true);
            },
            error => {
              obs.next(false);
            },
            () => {
              obs.complete();
            });
        }
      },
      error => {
        obs.next(false);
        obs.complete();
      });
    return obs.asObservable();
  }


  getHttpClient() {
    return this.http;
  }


  getHttpLogChannel() {
    return this.logChannel;
  }


  apiUrl(context: string | IRoutePointer): string {
    return this.api + (isString(context) ? context : (<IRoutePointer>context).route);
  }


  getRoute(route: string, method: string = 'get') {
    const routes = this.routes.filter(x => x.route === route);
    if (routes.length === 1) {
      return routes.shift();
    } else {
      return routes.find(x => x.method === method);
    }
  }

  /**
   * Add accessible route to service
   *
   * @param route
   */
  addRoute(route: IRoute) {
    if (!this.routes) {
      this.routes = [];
    }
    this.routes.push(route);
    this.routesLoaded.next(true);
  }


  /**
   * Reset routes.
   *
   * With the parameter "undef" can be set the reset value for routes variable.
   */
  resetRoutes(undef: boolean = false) {
    this.routes = !undef ? [] : undefined;
    this.routesLoaded.next(false);
  }

  /**
   *
   * @param context
   * @param options
   */
  callApi<T>(context: string | IRoutePointer, options?: IApiCallOptions): Observable<T> {
    const ret = new Subject();
    if (this.getState().getValue() === 'offline') {
      ret.error('Backend is offline.');
      ret.complete();
      return ret.asObservable() as any;
    }
    options = options || {};
    let cacheKey: string = null;

    const _method = isString(context) ? 'get' : get(context, 'method', 'get');
    const doCaching = _method === 'get';

    if (doCaching) {
      cacheKey = CryptUtils.shorthash(JSON.stringify({ c: context, o: options }));
      if (this.requestCache[cacheKey]) {
        return this.requestCache[cacheKey].asObservable();
      }
      this.requestCache[cacheKey] = ret;
    }

    this.inc();

    // @ts-ignore
    const sub = this.areRoutesLoaded().pipe(filter(x => x)).pipe(first()).subscribe(__x => {
        const apiContext = this.apiUrl(context);
        const route = this.getRoute(apiContext, _method);
        if (!route) {
          ret.error('Route "' + apiContext + '" not found, skipping.');
          ret.complete();
          this.dec();
          return null;
        }

        const method = route.method;
        const opts: IHttpRequestOptions = get(options, 'options', {});
        defaults(opts, {
          url: 'TODO',
          retry: 0
        });

        if (options.params) {
          opts.url = UrlHelper.replace(route.route as string, options.params);
        } else {
          opts.url = apiContext;
        }

        if (options.query) {
          const queryParts: string[] = [];
          for (const q of Object.keys(options.query)) {
            const value = options.query[q];
            if (isNumber(value) || isString(value) || isBoolean(value)) {
              queryParts.push(q + '=' + value);
            } else if (isArrayLike(value) || isArray(value)) {
              queryParts.push(q + '=' + value.join('&' + q + '='));
            } else if (isObjectLike(value)) {
              queryParts.push(q + '=' + JSON.stringify(value));
            } else {
              queryParts.push(q + '=' + value);
            }
          }
          if (!isEmpty(queryParts)) {
            opts.url += '?' + queryParts.join('&');
          }
        }

        if (options.content) {
          opts.body = options.content;
        }

        if (options.handle) {
          opts.callback = options.handle;
        }

        if (isBoolean(options.surpressErrors)) {
          opts.surpressErrors = options.surpressErrors;
        }

        ((this as any)[method](opts) as Observable<T>).subscribe(
          x => {
            ret.next(x);
          },
          error => {
            ret.error(error);
            this.dec();
            if (cacheKey) {
              delete this.requestCache[cacheKey];
            }
          },
          () => {
            ret.complete();
            this.dec();
            if (cacheKey) {
              delete this.requestCache[cacheKey];
            }
          }
        );
      },
      error => {
        Log.error(error);
        ret.error(error);
        ret.complete();
        this.dec();
        if (cacheKey) {
          delete this.requestCache[cacheKey];
        }
      });
    return ret.asObservable() as any;
  }


  /**
   * Implementation of get http method, which will also handle request errors
   *
   * @param url
   */
  get<T>(url: string | IHttpRequestOptions): Observable<T>;
  // eslint-disable-next-line no-dupe-class-members
  get<T>(url: string | IHttpRequestOptions, response?: (err: Error, data: T) => void): Observable<T> {
    const options: IHttpRequestOptions = isString(url) ? { url: url, logging: true } : url;
    if (response) {
      options.callback = response;
    }
    return this.handleRequest('get', options);
  }


  post<T>(url: string | IHttpRequestOptions, body: any | null): Observable<T>;
  // eslint-disable-next-line no-dupe-class-members
  post<T>(url: string | IHttpRequestOptions, body: any | null, response?: (err: Error, data: T) => void): Observable<T> {
    const options: IHttpRequestOptions = isString(url) ? { url: url, logging: true, body: body } : url;
    if (body) {
      options.body = body;
    }
    if (response) {
      options.callback = response;
    }
    return this.handleRequest('post', options);
  }


  delete<T>(url: string | IHttpRequestOptions): Observable<T>;
  // eslint-disable-next-line no-dupe-class-members
  delete<T>(url: string | IHttpRequestOptions, response?: (err: Error, data: T) => void): Observable<T> {
    const options: IHttpRequestOptions = isString(url) ? { url: url, logging: true } : url;
    if (response) {
      options.callback = response;
    }
    return this.handleRequest('delete', options);
  }


  put<T>(url: string | IHttpRequestOptions): Observable<T>;
  // eslint-disable-next-line no-dupe-class-members
  put<T>(url: string | IHttpRequestOptions, response?: (err: Error, data: T) => void): Observable<T> {
    const options: IHttpRequestOptions = isString(url) ? { url: url, logging: true } : url;
    if (response) {
      options.callback = response;
    }
    return this.handleRequest('put', options);
  }


  private handleRequest<T>(method: string, reqOptions: IHttpRequestOptions): Observable<T> {
    const logging = has(reqOptions, 'logging') ? reqOptions.logging : true;
    const surpressErrors = has(reqOptions, 'surpressErrors') ? reqOptions['surpressErrors'] : false;
    const client = this.getHttpClient() as HttpClient & any;

    Log.debug('handle request ' + method + ' ' + reqOptions.url);
    let observable: Observable<T> = null;
    if (has(reqOptions, 'body')) {
      observable = client[method](reqOptions.url, reqOptions.body, reqOptions);
    } else {
      observable = client[method](reqOptions.url, reqOptions);
    }

    observable = observable.pipe(mergeMap((x: any) => {
      const filterErrors = ErrorHelper.detectErrors(x);
      if (filterErrors.length > 0 && !surpressErrors) {
        throw filterErrors[0];
      }
      return of(x);
    }));

    if (has(reqOptions, 'callback')) {
      observable.subscribe(
        async value => {

          try {
            await reqOptions.callback(null, value);
          } catch (err) {
            if (logging) {
              this.logChannel.publish(LogMessage.error(err));
            }
          }
        },
        async error => {
          try {
            await reqOptions.callback(error, null);
          } catch (err) {
            if (logging) {
              this.logChannel.publish(LogMessage.error(error));
            }
          }
        });
    } else {
      observable.pipe(
        catchError((error: Error) => {
          if (logging) {
            this.logChannel.publish(LogMessage.error(error));
          }
          throw error;
        })
      );
    }


    return observable;
  }

  inc() {
    let value = this.activeCount$.getValue();
    this.activeCount$.next(++value);
  }

  dec() {
    let value = this.activeCount$.getValue();
    this.activeCount$.next(--value);
  }

}
