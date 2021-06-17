import { get, has, isArray, isEmpty, isNumber, keys, snakeCase, defaults, set, assign} from 'lodash';
import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {ClassType, IEntityRef, JS_DATA_TYPES} from '@allgemein/schema-api';
import {ExprDesc, Expressions} from '@allgemein/expressions';
import {IDTGridOptions} from '../../datatable/IDTGridOptions';
import {IGridColumn} from '../../datatable/IGridColumn';
import {C_PROPERTY, C_URL_PREFIX, CC_GRID_CELL_ENTITY_REFERENCE, CC_GRID_CELL_OBJECT_REFERENCE, CC_GRID_CELL_VALUE} from '../../constants';
import {IGridApi} from '../../datatable/IGridApi';
import {DatatableComponent} from '../../datatable/datatable.component';
import {IQueringService} from './IQueringService';
import {QueryAction} from './QueryAction';
import {IQueryParams} from '../../datatable/IQueryParams';
import {DEFAULT_DT_GRID_OPTIONS} from './Constants';
import {AbstractGridComponent} from '../../datatable/abstract-grid.component';
import {Helper} from './Helper';
import {IQueryComponentApi} from './IQueryComponentApi';
import {first} from 'rxjs/operators';
import {IFindOptions} from './IFindOptions';


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
export class AbstractQueryEmbeddedComponent implements OnInit, OnChanges, IQueryComponentApi {

  @Input()
  get params() {
    return this._params;
  }

  set params(v: IQueryParams) {
    this._params = v;
    this.paramsChange.emit(this._params);
  }


  @Input()
  name: string;

  @Input()
  columns: IGridColumn[];


  @Input()
  limit = 25;

  @Input()
  options: IDTGridOptions = {}; // = DEFAULT_DT_GRID_OPTIONS;

  @Input()
  freeQuery: any;

  @Output()
  freeQueryChange: EventEmitter<any> = new EventEmitter();

  _params: IQueryParams;

  @Output()
  paramsChange: EventEmitter<IQueryParams> = new EventEmitter();

  @Input()
  componentClass: ClassType<AbstractGridComponent>;

  entityRef: IEntityRef;

  error: any = null;

  _isLoaded: boolean = false;

  @ViewChild('datatable', {static: true})
  datatable: DatatableComponent;

  private queringService: IQueringService;


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
    defaults(this.options, DEFAULT_DT_GRID_OPTIONS);
    if (this.options) {
      // set initial options
      this.params.offset = get(this.options, 'offset', 0);
      this.params.limit = get(this.options, 'limit', 25);
      if (has(this.options, 'sorting')) {
        this.params.sorting = get(this.options, 'sorting');
      }
    }
  }


  ngOnInit() {
    if (!this.params) {
      this.params = {};
    }

    this.applyInitialOptions();

    this.queringService.isLoaded().subscribe(x => {
      this.findEntityDef();
      this.initialiseColumns();
      this._isLoaded = true;
      // api maybe not loaded
      if (get(this.options, 'queryOnInit', true)) {
        setTimeout(() => {
          this.doQuery(this.datatable.api());
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this._isLoaded) {
      if (changes['componentClass']) {
        this.datatable.gridReady.pipe(first()).subscribe(x => {
          this.requery();
        });
      } else if (changes['options']) {
        this.requery();
      }
    }
  }


  findEntityDef() {
    const registry = this.getQueryService().getRegistry();
    if (!registry) {
      return;
    }

    this.entityRef = registry.getEntityRefFor(this.name);

    if (!this.entityRef) {
      this.error = `Can't find entity type for ${this.name}.`;
    }
  }


  initialiseColumns() {
    if (!this.columns && !get(this.options, 'columnsOverride', false)) {
      this.columns = [];

      this.entityRef.getPropertyRefs().forEach(x => {

        const column: IGridColumn = {
          label: Helper.label(x, this.entityRef.getClassRef()),
          field: x.name,
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
      // try {
      //   mangoQuery = Expressions.fromJson(this.options.predefinedFilter);
      //   filterQuery.push(mangoQuery);
      // } catch (e) {
      //   Log.error(e);
      // }
    }

    const _d: any = {};
    if (api.params.offset) {
      _d['offset'] = api.params.offset;
    } else if (this.params.offset) {
      _d['offset'] = this.params.offset;
    } else {
      _d['offset'] = 0;
    }
    if (api.params.limit) {
      _d['limit'] = api.params.limit;
    } else if (this.params.limit) {
      _d['limit'] = this.params.limit;
    } else {
      _d['limit'] = 25;
    }
    if (!isEmpty(api.params.sorting)) {
      _d['sort'] = api.params.sorting;
    } else if (this.params.sorting) {
      _d['sort'] = this.params.sorting;
    }
    assign(queryOptions, _d);


    if (api.params && !isEmpty(api.params.filters)) {
      keys(api.params.filters).map(k => {
        if (!isEmpty(api.params.filters[k])) {
          const d = {};
          d[k] = api.params.filters[k];
          if (api.params.filters[k] instanceof ExprDesc) {
            d[k] = api.params.filters[k].toJson();
          }
          filterQuery.push(d);
          // try {
          //   const mq = Expressions.fromJson(api.params.filters[k]);
          //   filterQuery.push(mq);
          // } catch (e) {
          //   Log.error(e);
          // }
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
        mangoQuery = {$and: filterQuery};
      } else if (filterQuery.length === 1) {
        mangoQuery = filterQuery.shift();
      } else {
        mangoQuery = null;
      }

      if (mangoQuery) {
        executeQuery = mangoQuery;
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
        mangoQuery = {$and: filterQuery};
      } else if (filterQuery.length === 1) {
        mangoQuery = filterQuery.shift();
      } else {
        mangoQuery = null;
      }

      if (mangoQuery) {
        executeQuery.push({$match: mangoQuery});
      }

      this.queringService.aggregate(this.name, executeQuery, queryOptions)
        .subscribe(
          (results: any) => {
            if (results) {
              if (results.entities && has(results, '$count') && isNumber(results.$count)) {
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
        this.options.columnsPostProcess(this.columns, this);
      }
      api.setColumns(columns);
    }
  }


  reset() {
    this.params.offset = 0;
  }

}
