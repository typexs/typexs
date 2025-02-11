// @ts-ignore
import express from 'express';

import * as http from 'http';
import { createExpressServer, getMetadataArgsStorage } from 'routing-controllers';
import { IStaticFiles } from '../../IStaticFiles';
import { IRoutingController } from '../../IRoutingController';
import { IFrameworkSupport } from '../IFrameworkSupport';
import { Config } from '@typexs/base';
import { IRoute } from '../../../server/IRoute';
import { C_DEFAULT, K_ROUTE_CONTROLLER, K_ROUTE_STATIC } from '../../../Constants';
import { RoutePermissionsHelper } from '../../../RoutePermissionsHelper';
import { resolve } from 'path';
import { PlatformUtils } from '@allgemein/base';
import { IApplication } from '../../../server/IApplication';
import { ActionType } from 'routing-controllers/types/metadata/types/ActionType';
import { ActionMetadataArgs } from 'routing-controllers/types/metadata/args/ActionMetadataArgs';
import { clone, defaults, filter, find, isEmpty } from '@typexs/generic';


interface ActionResolved {
  route: string;
  type: ActionType;
  action: ActionMetadataArgs;
  authorized: boolean;
  permission: string | string[];
  params: any[];
}

const DEFAULT_ROUTE_OPTIONS = {
  limit: '10mb'
};

export class Express implements IFrameworkSupport {

  _app: express.Application;

  _routes: IRoute[];

  _mapOptions: { options: IRoutingController; mounted: express.Application }[] = [];

  async create() {
    this._app = express();
    this._app.disable('x-powered-by');
    return this;
  }


  useRouteController(options: IRoutingController) {
    defaults(options, DEFAULT_ROUTE_OPTIONS);
    const app = createExpressServer(options);
    app.disable('x-powered-by');
    // TODO create settings
    if (options.limit) {
      this.app().use(express.json({ limit: options.limit }));
      // this.app().use(express.json({limit: options.limit}));
      // this.app().use(bodyParser.urlencoded({limit: options.limit, extended: true}));
      // this.app().use(bodyParser());
    }

    this.app().use(app);
    this._mapOptions.push({ options: options, mounted: app });
    return this;
  }


  useStaticRoute(options: IStaticFiles) {
    let app: express.Application = null;
    let resolvePath: string = null;
    if (PlatformUtils.isAbsolute(options.path)) {
      resolvePath = options.path;
    } else {
      // TODO add sometimes appDir
      const appDir = Config.get('app.path', '.');
      resolvePath = resolve(appDir, options.path);
    }
    express.static(resolvePath);
    if (options.routePrefix) {
      const slash = /^\//.test(options.routePrefix) ? '' : '/';
      app = <express.Application>this.app().use(slash + options.routePrefix, express.static(resolvePath));
    } else {
      app = <express.Application>this.app().use(express.static(resolvePath));
    }
    this._mapOptions.push({ options: options, mounted: app });
    return this;
  }

  resolveMetadata(): ActionResolved[] {
    const res: ActionResolved[] = [];
    const metadataStore = getMetadataArgsStorage();
    const authHandlers = metadataStore.responseHandlers.filter(r => r.type === 'authorized');

    metadataStore.controllers.forEach(controller => {
      const controllerActions = filter(metadataStore.actions, a => a.target === controller.target);
      controllerActions.forEach(action => {
        let route = action.route instanceof RegExp ? action.route.source : action.route;
        if (controller.route) {
          route = controller.route + route;
        }

        const params = metadataStore.params.filter(param => param.method === action.method &&
          param.object.constructor === action.target);

        // TODO handle regex
        const permissions = RoutePermissionsHelper.getPermissionFor(action.target, action.method);
        const authorized = !!find(authHandlers, a => a.target === action.target && a.method === action.method);
        const entry: ActionResolved = {
          route: route,
          type: action.type,
          action: action,
          permission: permissions ? permissions.accessPermissions : null,
          authorized: authorized,
          params: params.map(p => ({ name: p.name, required: p.required, index: p.index, parse: p.parse }))
        };
        res.push(entry);
      });

    });
    return res;
  }

  getRoutes() {
    if (!this._routes) {
      this._routes = [];

      for (const appSetting of this._mapOptions) {
        const options = appSetting.options;
        const app = appSetting.mounted;
        const prefix = options.routePrefix;

        if (options.type === K_ROUTE_CONTROLLER) {
          const actions = this.resolveMetadata();
          const routeLayers = app._router ? app._router.stack : [];
          for (const entry of routeLayers) {
            if (entry.route) {
              const r = entry.route;
              let method = 'unknown';
              const params = clone(entry.params);

              for (const handle of r.stack) {
                if (handle.name !== 'routeHandler') {
                  continue;
                }
                method = handle.method;

                const action = find(actions, a =>
                  (prefix ? '/' + prefix + a.route === r.path : a.route === r.path) &&
                  a.type.toLowerCase() === method.toLowerCase()
                );

                if (action) {

                  this._routes.push({
                    context: options.context ? options.context : C_DEFAULT,
                    route: prefix ? '/' + prefix + action.route : action.route,
                    method: method,
                    params: action.params,
                    controller: action.action.target.name,
                    controllerMethod: action.action.method,
                    permissions: action.permission ? action.permission : null,
                    authorized: action.authorized
                  });

                } else {
                  this._routes.push({
                    context: options.context ? options.context : C_DEFAULT,
                    route: r.path,
                    method: method,
                    params: !isEmpty(params) ? params : null,
                    authorized: false
                  });

                }

              }
            }
          }
        } else if (options.type === K_ROUTE_STATIC) {
          this._routes.push({
            context: options.context ? options.context : C_DEFAULT,
            route: options.routePrefix ? (/^\//.test(options.routePrefix) ? options.routePrefix : '/' + options.routePrefix) : '/',
            method: 'get',
            serveStatic: true,
            params: null,
            authorized: false
          });
        }
      }
      // this._routes = uniq(this._routes);
    }

    return clone(this._routes);
  }


  app(): IApplication {
    if (!this._app) {
      throw new Error('app not created');
    }
    return this._app;
  }


  handle(req: http.IncomingMessage, res: http.ServerResponse) {
    this._app(req, res);
  }
}
