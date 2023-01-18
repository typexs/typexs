import { assign, defaults, get, has, isArray, isEmpty, isNumber, keys, set } from 'lodash';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { ClassType, IEntityRef, JS_DATA_TYPES } from '@allgemein/schema-api';
import { ExprDesc, Expressions } from '@allgemein/expressions';
import { IGridColumn } from '../../datatable/IGridColumn';
import {
  C_PROPERTY,
  C_URL_PREFIX,
  CC_GRID_CELL_ENTITY_REFERENCE,
  CC_GRID_CELL_OBJECT_REFERENCE,
  CC_GRID_CELL_VALUE
} from '../../constants';
import { IGridApi } from '../../datatable/IGridApi';
import { DatatableComponent } from '../../datatable/datatable.component';
import { IQueringService } from './IQueringService';
import { QueryAction } from './QueryAction';
import { IQueryParams } from '../../datatable/IQueryParams';
import { DEFAULT_QUERY_OPTIONS } from './Constants';
import { AbstractGridComponent } from '../../datatable/abstract-grid.component';
import { Helper } from './Helper';
import { IQueryComponentApi } from './IQueryComponentApi';
import { first } from 'rxjs/operators';
import { IFindOptions } from './IFindOptions';
import { LabelHelper, XS_P_$COUNT } from '@typexs/base';
import { IQueryOptions } from './IQueryOptions';
import { Log } from '../../lib/log/Log';
import { IGridEvent } from '../../datatable/IGridEvent';
import { Q_EVENT_TYPE_REBUILD, Q_EVENT_TYPE_REFRESH, Q_EVENT_TYPE_REQUERY } from '../../datatable/Constants';


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

  _isLoaded: boolean = false;

  queringService: IQueringService;


  setQueryService(storageService: IQueringService) {
    this.queringService = storageService;
  }


  getEntityRef() {
    return this.entityRef;
  }

  getQueryService() {
    return this.queringService;
  }

  applyInitialOptions() {
    defaults(this.options, DEFAULT_QUERY_OPTIONS);
    if (this.options) {
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

    this.datatable.gridReady.subscribe(
      this.onGridEvent.bind(this)
    );

    this.queringService.isLoaded().subscribe(x => {
      const success = this.findEntityRef();
      // TODO handle if entity ref not found or loaded
      if (success) {
        this.initialiseColumns();
        this._isLoaded = true;
        // api maybe not loaded
        if (get(this.options, 'queryOnInit', true)) {
          setTimeout(() => {
            this.doQuery(this.datatable.api());
          });
        }
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
    if (this._isLoaded) {
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
    this.entityRef = this.getQueryService().getEntityRefForName(this.name);
    if (!this.entityRef) {
      this.error = `Can't find entity type for ${this.name}.`;
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
        set(column, C_URL_PREFIX, this.queringService.getNgUrlPrefix());

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

  doQuery(api: IGridApi): void {
    const filterQuery: object[] = [];
    let executeQuery: any = null;
    let mangoQuery: object = null;
    const mode = this.options.queryType === 'aggregate' ? 'aggregate' : 'query';
    const queryOptions: IFindOptions = {};
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }
    if (this.options.predefinedFilter) {
      if (this.options.predefinedFilter instanceof ExprDesc) {
        filterQuery.push(this.options.predefinedFilter.toJson());
      } else {
        filterQuery.push(this.options.predefinedFilter);
      }
    }

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
    assign(queryOptions, _d);


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


    if (mode === 'query') {

      if (this.freeQuery) {
        const mQuery = Expressions.fromJson(this.freeQuery);
        if (!isEmpty(mQuery)) {
          filterQuery.push(mQuery.toJson());
        }
      }

      if (filterQuery.length > 1) {
        mangoQuery = { $and: filterQuery };
      } else if (filterQuery.length === 1) {
        mangoQuery = filterQuery.shift();
      } else {
        mangoQuery = null;
      }

      if (mangoQuery) {
        executeQuery = mangoQuery;
      }

      if (this.options.beforeQuery) {
        this.options.beforeQuery(executeQuery, queryOptions);
      }
      this.queringService.query(this.name, executeQuery, queryOptions)
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

      if (filterQuery.length > 1) {
        mangoQuery = { $and: filterQuery };
      } else if (filterQuery.length === 1) {
        mangoQuery = filterQuery.shift();
      } else {
        mangoQuery = null;
      }

      if (mangoQuery) {
        executeQuery.push({ $match: mangoQuery });
      }

      this.queringService.aggregate(this.name, executeQuery, queryOptions)
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
    this._isLoaded = false;
    this.entityRef = undefined;
    this.error = undefined;
  }
}
