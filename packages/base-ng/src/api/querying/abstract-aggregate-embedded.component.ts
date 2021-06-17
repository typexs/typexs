import {first, get, has, isArray, isEmpty, isNumber, keys, snakeCase} from 'lodash';
import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {IEntityRef, LookupRegistry, METATYPE_ENTITY} from '@allgemein/schema-api';
import {IGridColumn} from '../../datatable/IGridColumn';
import {IGridApi} from '../../datatable/IGridApi';
import {DatatableComponent} from '../../datatable/datatable.component';
import {IQueringService} from './IQueringService';
import {QueryAction} from './QueryAction';
import {IQueryParams} from '../../datatable/IQueryParams';
import {DEFAULT_DT_GRID_OPTIONS} from './Constants';
import {IDTGridOptions} from '../../datatable/IDTGridOptions';
import {Log} from '../../lib/log/Log';
import {C_DEFAULT} from '../../constants';
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
export class AbstractAggregateEmbeddedComponent implements OnInit {


  @Input()
  name: string;

  @Input()
  columns: IGridColumn[];

  @Input()
  registryName: string = C_DEFAULT;

  @Input()
  limit = 25;

  @Input()
  options: IDTGridOptions = DEFAULT_DT_GRID_OPTIONS;

  @Input()
  freeQuery: any;

  @Output()
  freeQueryChange: EventEmitter<any> = new EventEmitter();

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

  entityRef: IEntityRef;

  error: any = null;


  @ViewChild('datatable', {static: true})
  datatable: DatatableComponent;


  private queringService: IQueringService;


  setQueryService(storageService: IQueringService) {
    this.queringService = storageService;
  }


  getQueryService() {
    return this.queringService;
  }


  ngOnInit() {
    if (!this.params) {
      this.params = {};
    }

    if (this.options) {
      this.params.offset = get(this.options, 'offset', 0);
      this.params.limit = get(this.options, 'limit', 25);
    }

    this.queringService.isReady((value: boolean, error: Error) => {
      if (!value) {
        return;
      }

      this.findEntityDef();
      // this.initialiseColumns();

      // api maybe not loaded
      // setTimeout(() => {
      //   this.doAggregate(this.datatable.api());
      // });
    });
  }


  findEntityDef() {
    this.entityRef = LookupRegistry.$(this.registryName).find(METATYPE_ENTITY, (e: IEntityRef) => {
      return e.machineName === snakeCase(this.name);
    });

    if (!this.entityRef) {
      this.error = `Can't find entity type for ${this.name}.`;
    }
  }


  rebuildColumns(data: any[]) {
    const _first = first(data);
    const columns = [];
    for (const k of keys(_first)) {
      const column: IGridColumn = {
        label: k,
        field: k,
        sorting: true
      };
      columns.push(column);
    }
    return columns;
  }

  /**
   * Re-Query
   */
  requery() {
    this.doAggregate(this.datatable.api());
  }


  onQueryAction(action: QueryAction) {
    this.datatable.api().reset();
    this.freeQuery = action.query;
    this.doAggregate(this.datatable.api());
  }


  doAggregate(api: IGridApi): void {
    let executeQuery: any = [];

    if (!this.freeQuery) {
      // error not
      Log.error('Aggregate query is not present.');
      return;
    } else if (!isArray(this.freeQuery)) {
      executeQuery = [this.freeQuery];
    } else {
      executeQuery = this.freeQuery;
    }


    const queryOptions: IFindOptions = {
      offset: api.params.offset,
      limit: api.params.limit
    };

    if (!isEmpty(api.params.sorting)) {
      queryOptions.sort = api.params.sorting;
    }


    this.queringService.aggregate(this.name, executeQuery, queryOptions)
      .subscribe(
        (results: any) => {
          if (results && results.entities && has(results, '$count') && isNumber(results.$count)) {
            const columns = this.rebuildColumns(results.entities);
            api.setColumns(columns);
            api.setRows(results.entities);
            api.setMaxRows(results.$count);
            api.rebuild();
          }
        }
      );

  }


  reset() {
    this.params.offset = 0;
  }

}
