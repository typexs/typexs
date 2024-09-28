import { assign, defaults, get, has, isArray, isEmpty, isNumber, keys, set } from 'lodash';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ClassType, IEntityRef, JS_DATA_TYPES } from '@allgemein/schema-api';
import { ExprDesc, Expressions } from '@allgemein/expressions';
import { IGridColumn } from '../../datatable/api/IGridColumn';
import {
  C_PROPERTY,
  C_URL_PREFIX,
  CC_GRID_CELL_ENTITY_REFERENCE,
  CC_GRID_CELL_OBJECT_REFERENCE,
  CC_GRID_CELL_VALUE
} from '../../constants';
import { IGridApi } from '../../datatable/api/IGridApi';
import { DatatableComponent } from '../../datatable/datatable.component';
import { IQueringService } from './IQueringService';
import { QueryAction } from './QueryAction';
import { IQueryParams } from '../../datatable/api/IQueryParams';
import { DEFAULT_QUERY_OPTIONS, K_AGGREGATE, K_QUERY } from './Constants';
import { AbstractGridComponent } from '../../datatable/api/abstract-grid.component';
import { Helper } from './Helper';
import { IQueryComponentApi } from './IQueryComponentApi';
import { filter, first, map } from 'rxjs/operators';
import { IFindOptions } from './IFindOptions';
import { LabelHelper } from '@typexs/base';
import { IQueryOptions } from './IQueryOptions';
import { Log } from '../../lib/log/Log';
import { IGridEvent } from '../../datatable/api/IGridEvent';
import { XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET } from '../../datatable/Constants';
import { BehaviorSubject, Observable } from 'rxjs';
import { K_OPTIONS } from '../../datatable/api/IGridMode';
import { K_REBUILD } from '../../lib/datanodes/Constants';
import { IParamsOverride } from './IParamsOverride';

/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  template: '<txs-datatable></txs-datatable>'
})
export class AbstractQueryComponent implements OnInit, OnChanges, IQueryComponentApi {

  /**
   * Resolve datatable reference before content change detection
   */
  @ViewChild(DatatableComponent, { static: true })
  datatable: DatatableComponent;

  @Input()
  name: string;

  @Input()
  entityName: string;

  @Input()
  options: IQueryOptions = {};

  _params: IQueryParams;

  @Input()
  get params() {
    return this._params;
  }

  set params(v: IQueryParams) {
    this._params = v;
    this.paramsChange.emit(this._params);
  }

  @Output()
  paramsChange: EventEmitter<IQueryParams> = new EventEmitter();

  @Input()
  columns: IGridColumn[];

  @Input()
  freeQuery: any;

  @Output()
  freeQueryChange: EventEmitter<any> = new EventEmitter();

  @Input()
  componentClass: ClassType<AbstractGridComponent>;

  entityRef: IEntityRef;

  error: any = null;

  queringService: IQueringService;

  ready$ = new BehaviorSubject(false);

  /**
   * ==============================
   *  Angular implementations
   * ==============================
   */

  /**
   * Impl. of onInit method
   *
   */
  ngOnInit() {
    if (!this.params) {
      this.params = {};
    }
    this.applyOptions();

    this.datatable.getControlObserver().subscribe(this.onGridEvent.bind(this));
    // this.isReady$.subscribe(x => {
    //   if (x) {
    //     setTimeout(() => {
    //       this.datatable.emitInitialize();
    //     });
    //   }
    // });
    this.initialize();
  }


  /**
   * ==============================
   */
  getEntityName() {
    if (this.name) {
      return this.name;
    }
    if (this.entityName) {
      return this.entityName;
    }
    throw new Error('entity name is not present');
  }


  setQueryService(storageService: IQueringService) {
    this.queringService = storageService;
  }


  getEntityRef() {
    return this.entityRef;
  }

  getQueryService() {
    return this.queringService;
  }

  hasQueryService() {
    return !!this.queringService;
  }

  applyOptions() {
    defaults(this.options, DEFAULT_QUERY_OPTIONS);
    if (this.options) {
      // add callback for record retrieval
      if (!this.options.queryCallback) {
        this.options.queryCallback = this.queryCallback.bind(this);
      }
      // set initial options
      this.params.offset = get(this.options, 'offset', 0);
      this.params.limit = get(this.options, 'limit', 25);
      if (has(this.options, 'sorting')) {
        this.params.sorting = get(this.options, 'sorting');
      } else if (has(this.options, 'sort')) {
        this.params.sorting = get(this.options, 'sort');
      }
    }
  }


  initialize() {
    this.getQueryService().isLoaded().subscribe(x => {
      const success = this.findEntityRef();
      // TODO handle if entity ref not found or loaded
      if (success) {
        this.initialiseColumns();
        this.ready$.next(true);
      } else {
        throw new Error(this.error);
      }
    });
  }


  /**
   * Processing grid events passed through gridReady event emitter.
   * If "options.eventHandle" exists then it will handle passed events.
   * When returns false then further processing is aborted.
   *
   * Current handled event types are
   * - 'requery' - run re-query
   * - 'refresh' - run re-query
   *
   * @param x: IGridEvent
   */
  onGridEvent(x: IGridEvent) {
    if (!x) {
      return;
    }
    let res = true;
    // if (this.options.eventHandle) {
    //   res = this.options.eventHandle(x, this);
    // }
    //
    // if (res) {
    //   if (x.event === Q_EVENT_TYPE_REQUERY) {
    //     this.requery();
    //   } else if (x.event === Q_EVENT_TYPE_REFRESH) {
    //     this.doQuery(this.datatable.api());
    //   }
    // }
  }

  /**
   * Listen on value changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (this.ready$.getValue()) {
      if (changes['componentClass']) {
        this.datatable.triggerControl(K_REBUILD);
      } else if (changes['options']) {
        this.datatable.triggerControl(K_OPTIONS, 'query-options');
      } else if (changes['name']) {
        this.reset();
        this.initialize();
      }
    }
  }


  findEntityRef() {
    this.entityRef = this.getQueryService().getEntityRefForName(this.getEntityName());
    if (!this.entityRef) {
      this.error = `Can't find entity type for ${this.getEntityName()}.`;
      return false;
    }
    return true;
  }


  initialiseColumns() {
    if (!this.columns && !get(this.options, 'columnsOverride', false)) {
      this.columns = [];

      this.entityRef.getPropertyRefs().forEach(x => {

        const column: IGridColumn = {
          label: LabelHelper.labelForProperty(x),
          field: x.name
        };

        // add property reference to column definition
        set(column, C_PROPERTY, x);
        set(column, C_URL_PREFIX, this.getQueryService().getNgUrlPrefix());

        let cellRenderer: string = CC_GRID_CELL_VALUE;
        if (x.isReference()) {
          if (x.getTargetRef().hasEntityRef()) {
            cellRenderer = CC_GRID_CELL_ENTITY_REFERENCE;
          } else {
            cellRenderer = CC_GRID_CELL_OBJECT_REFERENCE;
          }
        }

        column.cellValueRenderer = cellRenderer;
        if (!x.isReference()) {
          column.sorting = true;
          const datatype = <JS_DATA_TYPES>x.getType();
          if (datatype) {
            switch (datatype.toLowerCase()) {
              case 'number':
                column.filter = true;
                column.filterType = 'equal';
                column.filterDataType = datatype;
                break;
              case 'text':
              case 'string':
                column.filter = true;
                column.filterType = 'contains';
                column.filterDataType = datatype;
                break;
            }
          }
        }
        this.columns.push(column);
      });

      if (this.options.columnsPostProcess) {
        this.options.columnsPostProcess(this.columns, this);
      }
    }
  }

  /**
   * Re-Query
   */
  requery() {
    this.doQuery(this.datatable.api());
  }


  onQueryAction(action: QueryAction) {
    this.datatable.api().reset();
    this.freeQuery = action.query;
    this.datatable.triggerControl(K_QUERY);
    // this.doQuery(this.datatable.api());
  }

  /**
   * used in template
   * @param gridEvent
   */
  onGridReady(gridEvent: IGridEvent) {
    this.onGridEvent(gridEvent);
  }


  prepareFilterQuery() {
    const filterQuery: object[] = [];
    if (this.options.predefinedFilter) {
      if (this.options.predefinedFilter instanceof ExprDesc) {
        filterQuery.push(this.options.predefinedFilter.toJson());
      } else {
        filterQuery.push(this.options.predefinedFilter);
      }
    }
    return filterQuery;
  }

  /**
   * Prepare parameter for query with sourceKey and fallback
   *
   * @param api
   * @param override
   * @param sourceKey
   * @param fallback
   * @private
   */
  private _prepareParam(api: IGridApi, override: IParamsOverride = {}, sourceKey: string, fallback?: any) {
    let _d = null;
    if (typeof override[sourceKey] === 'number' && !isNaN(override[sourceKey])) {
      _d = override[sourceKey];
    } else if (api && api.params && api.params[sourceKey]  && !isNaN(api.params[sourceKey])) {
      _d = api.params[sourceKey];
    } else if (this.params[sourceKey] && !isNaN(this.params[sourceKey])) {
      _d = this.params[sourceKey];
    } else if (typeof fallback !== 'undefined') {
      _d = fallback;
    }
    return _d;
  }

  /**
   * Prepare parameters for query range and sort directions
   *
   * @param api
   * @param override
   */
  prepareParams(api: IGridApi, override: IParamsOverride = {}) {
    const _d: any = {
      offset: this._prepareParam(api, override, 'offset', 0),
      limit: this._prepareParam(api, override, 'limit', 25)
    };
    const sort = this._prepareParam(api, override, 'sorting');
    if (sort) {
      _d['sort'] = sort;
    }
    return _d;
  }

  applyQueryOptions() {
    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }
    return queryOptions;
  }

  applyParams(api: IGridApi, filterQuery: any[]) {
    if (!isEmpty(api?.params?.filters)) {
      keys(api.params.filters).map(k => {
        try {
          const d = {};
          d[k] = api.params.filters[k];
          if (api.params.filters[k] instanceof ExprDesc) {
            d[k] = api.params.filters[k].toJson();
          }
          filterQuery.push(d);
        } catch (e) {
          Log.error(e);
        }
      });
    }
  }

  applyFreeQuery(filterQuery: any[]) {
    if (this.freeQuery) {
      let mQuery = this.freeQuery;
      if (!(this.freeQuery instanceof ExprDesc)) {
        mQuery = Expressions.fromJson(this.freeQuery);
      }
      if (!isEmpty(mQuery)) {
        filterQuery.push(mQuery.toJson());
      }
    }
  }

  /**
   * Empty method for extending query by extensions
   *
   * @param api
   * @param filterQuery
   * @param queryOptions
   */
  applyQueryAdditions(api: IGridApi, filterQuery: any[], queryOptions: any) {
  }


  buildMangoQuery(filterQuery: any[]) {
    let mangoQuery: object = null;
    const _filterQuery = filterQuery.map(x => x instanceof ExprDesc ? x.toJson() : x).filter(x => !!x);
    if (_filterQuery.length > 1) {
      mangoQuery = { $and: _filterQuery };
    } else if (_filterQuery.length === 1) {
      mangoQuery = _filterQuery.shift();
    } else {
      mangoQuery = null;
    }
    return mangoQuery;
  }


  doPlainQuery(api: IGridApi, override: IParamsOverride = {}) {
    override = override || {};
    const filterQuery = this.prepareFilterQuery();
    const queryOptions = this.applyQueryOptions();
    const _d = this.prepareParams(api, override);
    assign(queryOptions, _d);
    this.applyParams(api, filterQuery);
    this.applyFreeQuery(filterQuery);
    this.applyQueryAdditions(api, filterQuery, queryOptions);

    const executeQuery = this.buildMangoQuery(filterQuery);
    if (this.options.beforeQuery) {
      this.options.beforeQuery(executeQuery, queryOptions);
    }
    return this.getQueryService().query(this.getEntityName(), executeQuery, queryOptions);
  }

  doPlainAggregate(api: IGridApi, override: IParamsOverride = {}) {
    override = override || {};
    const filterQuery = this.prepareFilterQuery();
    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }

    const _d = this.prepareParams(api, override);
    assign(queryOptions, _d);

    this.applyParams(api, filterQuery);
    let executeQuery = [];
    if (this.freeQuery) {
      if (isArray(this.freeQuery)) {
        executeQuery = this.freeQuery;
      } else {
        throw new Error('aggregation query is not an array');
      }
    } else {
      throw new Error('aggregation query is empty');
    }

    const mangoQuery = this.buildMangoQuery(filterQuery);
    if (mangoQuery) {
      executeQuery.push({ $match: mangoQuery });
    }
    return this.getQueryService().aggregate(this.getEntityName(), executeQuery, queryOptions);
  }

  /**
   * Return the mode of the query. Which can be "query" or "aggregate".
   */
  getQueryMode() {
    return this.options.queryType === K_AGGREGATE ? K_AGGREGATE : K_QUERY;
  }

  /**
   * Impl. queryCallback for grid component
   *
   * @param start
   * @param end
   * @param limit
   */
  queryCallback(start: number, end: number, limit?: number): Observable<any[]> {
    return this.executeQuery(this.datatable.api(), { offset: start, limit: end - start + 1 });
  }

  /**
   * Execute query
   *
   * @param api
   */
  executeQuery(api: IGridApi, override: IParamsOverride = {}) {
    const mode = this.getQueryMode();
    if (mode === K_QUERY) {
      return this.doPlainQuery(api, override)
        .pipe(
          filter(x => !(x === null || x === undefined)),
          map(results => {
            return this._processQueryResults(results);
          })
        );
    } else {
      return this.doPlainAggregate(api, override)
        .pipe(map(results => {
          return this._processQueryResults(results);
        }));
    }
  }

  /**
   * Process results from query
   *
   * @param results
   */
  _processQueryResults(results: any) {
    if (results) {
      if (results.entities) {
        [XS_P_$COUNT, XS_P_$LIMIT, XS_P_$OFFSET].forEach(x => {
          if (has(results, x) && isNumber(results[x])) {
            results.entities[x] = results[x];
          }
        });
        return results.entities;
      }
    }
    return [];
  }

  doQuery(api: IGridApi, override: IParamsOverride = {}): void {
    const query = this.executeQuery(api, override);
    query.pipe(first()).subscribe(x => {
      if (!this.entityRef) {
        this.rebuildColumns(x, api);
      }
      api.setRows(x);
      api.rebuild({ event: K_REBUILD, api: api, data: { rows: x } });
    });
  }


  private rebuildColumns(entities: any[], api: IGridApi) {
    if (!get(this.options, 'columnsOverride', false)) {
      const columns = Helper.rebuildColumns(entities);
      if (this.options.columnsPostProcess) {
        this.options.columnsPostProcess(columns, this);
      }
      api.setColumns(columns);
    }
  }


  /**
   * Reset the component values
   */
  reset() {
    this.params.offset = 0;
    this.datatable.reset();
    // this.isReady$.next(false);
    this.entityRef = undefined;
    this.error = undefined;
  }
}
