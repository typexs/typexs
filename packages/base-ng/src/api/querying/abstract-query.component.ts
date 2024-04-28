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
import { LabelHelper, XS_P_$COUNT } from '@typexs/base';
import { IQueryOptions } from './IQueryOptions';
import { Log } from '../../lib/log/Log';
import { IGridEvent } from '../../datatable/api/IGridEvent';
import { Q_EVENT_TYPE_REBUILD, Q_EVENT_TYPE_REFRESH, Q_EVENT_TYPE_REQUERY } from '../../datatable/Constants';
import { BehaviorSubject, Observable, of } from 'rxjs';


/**
 * Storage query embedded component
 *
 * Possibilities:
 * - sorting
 * - filters
 * - extend/add specialized columns
 */
@Component({
  template: ''
})
export class AbstractQueryComponent implements OnInit, OnChanges, IQueryComponentApi {

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

  @ViewChild('datatable', { static: true })
  datatable: DatatableComponent;

  entityRef: IEntityRef;

  error: any = null;

  isReady$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  queringService: IQueringService;

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

  applyInitialOptions() {
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


  ngOnInit() {
    this.doInit();
  }

  doInit() {
    if (!this.params) {
      this.params = {};
    }

    this.applyInitialOptions();

    this.datatable.gridReady.subscribe(this.onGridEvent.bind(this));

    this.getQueryService().isLoaded().subscribe(x => {
      const success = this.findEntityRef();
      // TODO handle if entity ref not found or loaded
      if (success) {
        this.initialiseColumns();
        this.isReady$.next(true);
        setTimeout(() => {
          this.datatable.emitInitialize();
        });

        // this.datatable.doInitialize();
        // this.datatable.emitEvent('initialize', null);
        // api maybe not loaded
        // if (get(this.options, 'queryOnInit', true)) {
        //   setTimeout(() => {
        //     this.doQuery(this.datatable.api());
        //   });
        // }
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
    let res = true;
    if (this.options.eventHandle) {
      res = this.options.eventHandle(x, this);
    }

    if (res) {
      if (x.event === Q_EVENT_TYPE_REQUERY) {
        this.requery();
      } else if (x.event === Q_EVENT_TYPE_REFRESH) {
        this.doQuery(this.datatable.api());
      }
    }
  }

  /**
   * Listen on value changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (this.isReady$.getValue()) {
      if (changes['componentClass']) {
        this.datatable.gridReady.pipe(first()).subscribe(x => {
          if (x.event === Q_EVENT_TYPE_REBUILD) {
            this.requery();
          }
        });
      } else if (changes['options']) {
        this.requery();
      } else if (changes['name']) {
        this.reset();
        this.doInit();
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
    this.doQuery(this.datatable.api());
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


  prepareParams(api: IGridApi) {
    const _d: any = {};
    if (api?.params?.offset) {
      _d['offset'] = api.params.offset;
    } else if (this.params.offset) {
      _d['offset'] = this.params.offset;
    } else {
      _d['offset'] = 0;
    }
    if (api?.params?.limit) {
      _d['limit'] = api.params.limit;
    } else if (this.params.limit) {
      _d['limit'] = this.params.limit;
    } else {
      _d['limit'] = 25;
    }
    if (!isEmpty(api?.params?.sorting)) {
      _d['sort'] = api.params.sorting;
    } else if (this.params.sorting) {
      _d['sort'] = this.params.sorting;
    }
    return _d;
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
      const mQuery = Expressions.fromJson(this.freeQuery);
      if (!isEmpty(mQuery)) {
        filterQuery.push(mQuery.toJson());
      }
    }
  }

  buildMangoQuery(filterQuery: any[]) {
    let mangoQuery: object = null;
    if (filterQuery.length > 1) {
      mangoQuery = { $and: filterQuery };
    } else if (filterQuery.length === 1) {
      mangoQuery = filterQuery.shift();
    } else {
      mangoQuery = null;
    }
    return mangoQuery;
  }


  doPlainQuery(api: IGridApi) {
    const filterQuery = this.prepareFilterQuery();

    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }

    const _d = this.prepareParams(api);
    assign(queryOptions, _d);

    this.applyParams(api, filterQuery);
    this.applyFreeQuery(filterQuery);

    let executeQuery: any = null;

    const mangoQuery = this.buildMangoQuery(filterQuery);
    if (mangoQuery) {
      executeQuery = mangoQuery;
    }

    if (this.options.beforeQuery) {
      this.options.beforeQuery(executeQuery, queryOptions);
    }
    return this.getQueryService().query(this.getEntityName(), executeQuery, queryOptions);
  }

  doPlainAggregate(api: IGridApi) {
    const filterQuery = this.prepareFilterQuery();

    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }

    const _d = this.prepareParams(api);
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

  getQueryMode() {
    return this.options.queryType === K_AGGREGATE ? K_AGGREGATE : K_QUERY;
  }

  queryCallback(start: number, end: number, limit?: number): Observable<any[]> {
    const mode = this.getQueryMode();

    if (mode === K_QUERY) {
      return this.doPlainQuery(this.datatable.api())
        .pipe(
          filter(x => !(x === null || x === undefined)),
          map(results => {
            if (results) {
              if (results.entities && has(results, XS_P_$COUNT) && isNumber(results.$count)) {
                results.entities[XS_P_$COUNT] = results[XS_P_$COUNT];
                return results.entities;
              }
            }
            return [];
          })
        );
    } else {
      return this.doPlainAggregate(this.datatable.api()).pipe(map(results => {
        if (results) {
          if (results.entities && has(results, XS_P_$COUNT) && isNumber(results.$count)) {
            results.entities[XS_P_$COUNT] = results[XS_P_$COUNT];
            return results.entities;
          }
        }
        return [];
      }));
    }
  }

  doQuery(api: IGridApi): void {
    let executeQuery: any = null;
    const mode = this.getQueryMode();
    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }

    const filterQuery = this.prepareFilterQuery();

    const _d = this.prepareParams(api);
    assign(queryOptions, _d);

    this.applyParams(api, filterQuery);

    if (mode === K_QUERY) {
      this.applyFreeQuery(filterQuery);
      const mangoQuery = this.buildMangoQuery(filterQuery);

      if (mangoQuery) {
        executeQuery = mangoQuery;
      }

      if (this.options.beforeQuery) {
        this.options.beforeQuery(executeQuery, queryOptions);
      }
      this.getQueryService().query(this.getEntityName(), executeQuery, queryOptions)
        .subscribe(
          (results: any) => {
            if (results) {
              if (results.entities && has(results, '$count') && isNumber(results.$count)) {
                if (!this.entityRef) {
                  this.rebuildColumns(results.entities, api);
                }
                api.setRows(results.entities);
                api.setMaxRows(results.$count);
                api.rebuild();
              }
            }
          }
        );
    } else {
      executeQuery = [];
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

      this.getQueryService().aggregate(this.getEntityName(), executeQuery, queryOptions)
        .subscribe(
          (results: any) => {
            if (results) {
              if (results.entities && has(results, XS_P_$COUNT) && isNumber(results.$count)) {
                this.rebuildColumns(results.entities, api);
                api.setRows(results.entities);
                api.setMaxRows(results.$count);
                api.rebuild();
              }
            }
          }
        );
    }
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
    this.isReady$.next(false);
    this.entityRef = undefined;
    this.error = undefined;
  }
}
