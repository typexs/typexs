import { Component, Input } from '@angular/core';
import { assign, defaultsDeep, has, isEmpty } from 'lodash';
import {
  AbstractQueryComponent,
  IDatatableListGridOptions,
  IEntityViewOptions,
  IGridApi,
  K_REBUILD,
  ListViewComponent
} from '@typexs/base-ng';
import { IElasticFindOptions, ISearchFacet } from '@typexs/search';
import { ExprDesc, Expressions, In, Key, Like, Value } from '@allgemein/expressions';
import { StorageService } from '@typexs/storage-ng';
import { __CLASS__, __NS__ } from '@allgemein/schema-api';
import { C_SEARCH_INDEX } from '../../Constants';


/**
 * Component that contains a search input and a list of search results
 */
@Component({
  selector: 'txs-search-embedded',
  templateUrl: './search-embedded.component.html',
  styleUrls: ['./search-embedded.component.scss']
})
export class SearchEmbeddedComponent extends AbstractQueryComponent {

  /**
   * Name the searchable entities, if empty search all with '*'
   */
  @Input()
  entityTypes: string[] = [];

  @Input()
  facets: ISearchFacet[] = [
    { name: 'Class', type: 'value', field: __CLASS__ + '.keyword' },
    { name: 'Namespace', type: 'value', field: __NS__ + '.keyword' }
  ];

  private selectedFacets: any[] = [];


  constructor(private storageService: StorageService) {
    super();
    this.setQueryService(storageService);
    this.componentClass = ListViewComponent;
  }


  applySearchSpace() {
    this.name = '*';
    if (!isEmpty(this.entityTypes)) {
      this.name = this.entityTypes.join(',');
    }
  }


  // ngOnInit() {
  //   super.ngOnInit();
  // }

  /**
   * Override initialize
   */
  initialize() {
    defaultsDeep(this.options, <IDatatableListGridOptions>{
      viewOptions: <IEntityViewOptions>{
        resolver: {
          namespace: C_SEARCH_INDEX,
          idKeys: [
            { key: '_id', optional: true }
          ]
        }
      }
    });
    this.applySearchSpace();
    this.getQueryService().isLoaded().subscribe(x => {
      this.ready$.next(true);
    });
  }

  // doInit() {
  //   if (!this.params) {
  //     this.params = {};
  //   }
  //
  //   if (!this.componentClass) {
  //     this.componentClass = ListViewComponent;
  //   }
  //
  //   this.applySearchSpace();
  //   // super.ngOnInit();
  //   // this.applyOptions();
  //   //
  //   // this.getQueryService().isLoaded().subscribe(x => {
  //   //   // this.isReady$.next(true);
  //   //   // api maybe not loaded
  //   //   setTimeout(() => {
  //   //     this.doQuery(this.datatable.api());
  //   //   });
  //   // });
  // }


  // onQueryAction(action: QueryAction) {
  //   this.datatable.api().reset();
  //   this.freeQuery = action.query;
  //   this.doQuery(this.datatable.api());
  // }


  onFacet(data: any) {
    // this.requery();
    this.datatable.triggerControl(K_REBUILD);
  }


  // doQuery(api: IGridApi): void {
  //   const filterQuery = this.prepareFilterQuery();
  //   const queryOptions = this.applyQueryOptions();
  //   const _d: any = this.prepareParams(api);
  //   assign(queryOptions, _d);
  //   this.applyParams(api, filterQuery);
  //   this.applyFreeQuery(filterQuery);
  //   this.applyQueryAdditions(api, filterQuery, queryOptions)
  //
  //   let executeQuery: any = null;
  //   let mangoQuery = this.buildMangoQuery(filterQuery) as ExprDesc;
  //   if (mangoQuery) {
  //     executeQuery = mangoQuery.toJson();
  //   }
  //
  //   if (this.options.beforeQuery) {
  //     this.options.beforeQuery(executeQuery, queryOptions);
  //   }
  //
  //   this.getQueryService().query(this.name, executeQuery, queryOptions)
  //     .subscribe(
  //       (results: any) => {
  //         if (results) {
  //           if (results.entities && has(results, '$count') && typeof results.$count === 'number') {
  //             const res = this._processQueryResults(results);
  //
  //             api.setMaxRows(res['$count']);
  //             api.setRows(res);
  //             api.rebuild();
  //           }
  //         }
  //       }
  //     );
  // }

  applyQueryOptions() {
    const queryOptions: IElasticFindOptions = {
      passResults: true
    };
    if (this.options.queryOptions) {
      assign(queryOptions, this.options.queryOptions);
    }
    return queryOptions;
  }

  applyFreeQuery(filterQuery: any[]) {
    let mangoQuery: ExprDesc = null;
    if (this.freeQuery) {
      if (typeof this.freeQuery === 'string') {
        mangoQuery = Like(Key('_all'), Value(this.freeQuery));
        if (!isEmpty(mangoQuery)) {
          filterQuery.push(mangoQuery);
        }
      } else {
        mangoQuery = Expressions.fromJson(this.freeQuery);
        if (!isEmpty(mangoQuery)) {
          filterQuery.push(mangoQuery);
        }
      }
    }
  }

  /**
   * Use method for extending query with facets
   *
   * @param api
   * @param filterQuery
   * @param queryOptions
   */
  applyQueryAdditions(api: IGridApi, filterQuery: any[], queryOptions: any) {
    // TODO impl
    this.selectedFacets = [];
    if (!isEmpty(this.facets)) {
      queryOptions.facets = {};
      for (const f of this.facets) {
        queryOptions.facets[f.field] = [
          <any>{ name: f.name, type: f.type }
        ];

        if (f.results) {
          const selectedResults = f.results.filter((x: any) => x.selected);
          if (!isEmpty(selectedResults)) {
            filterQuery.push(In(f.field, selectedResults.map((x: any) => x.key)));
            selectedResults.forEach((x: any) => {
              this.selectedFacets.push({ name: f.name, key: x.key });
            });
          }
        }
      }
    }
  }


  _processQueryResults(results: any[]) {
    const _results = super._processQueryResults(results);
    if (has(results, '$facets')) {
      // results['$facets'];
      for (const f of results['$facets']) {
        const entry = this.facets.find(x => x.name === f.name);
        entry.results = f.values ? f.values : [];
        this.selectedFacets.filter((x: any) => x.name === f.name).forEach(x => {
          const resultedEntry = entry.results.find((y: any) => y.key === x.key);
          if (resultedEntry) {
            resultedEntry.selected = true;
          }
        });
      }
    }
    return _results;
  }


}

