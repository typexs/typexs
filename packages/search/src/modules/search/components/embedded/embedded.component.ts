import {Component, Input} from '@angular/core';
import * as _ from 'lodash';
import {AbstractQueryEmbeddedComponent, IGridApi, ListViewComponent, StorageService} from '@typexs/ng-base';
import {ISearchFacet} from '../../../../lib/search/ISearchFacet';
import {IElasticFindOptions} from '../../../../lib/elastic/ops/IElasticFindOptions';
import {And, ExprDesc, Expressions, In, Key, Like, Value} from 'commons-expressions/browser';
import {QueryAction} from '../query-form/QueryAction';

/**
 * Component that contains a search input and a list of search results
 */
@Component({
  selector: 'txs-search-embedded',
  templateUrl: './embedded.component.html',
  styleUrls: ['./embedded.component.scss']
})
export class SearchEmbeddedComponent extends AbstractQueryEmbeddedComponent {

  /**
   * Name the searchable entities, if empty search all with '*'
   */
  @Input()
  entityTypes: string[] = [];

  @Input()
  facets: ISearchFacet[] = [
    {name: 'type', type: 'value', field: '__type.keyword'},
    {name: 'sap_client', type: 'value', field: '_clientId.keyword'}
  ];

  showFilter: boolean = true;


  constructor(private storageService: StorageService) {
    super();
    this.setQueryService(storageService);
    this.componentClass = ListViewComponent;
  }


  applySearchSpace() {
    this.name = '*';
    if (!_.isEmpty(this.entityTypes)) {
      this.name = this.entityTypes.join(',');
    }
  }


  ngOnInit() {
    if (!this.params) {
      this.params = {};
    }

    if (!this.componentClass) {
      this.componentClass = ListViewComponent;
    }

    this.applySearchSpace();
    this.applyInitialOptions();

    this.getQueryService().isLoaded().subscribe(x => {
      this._isLoaded = true;
      // api maybe not loaded
      setTimeout(() => {
        this.doQuery(this.datatable.api());
      });
    });
  }


  onQueryAction(action: QueryAction) {
    this.datatable.api().reset();
    this.freeQuery = action.query;
    this.doQuery(this.datatable.api());
  }


  onFacet(data: any) {
    this.requery();
  }


  doQuery(api: IGridApi): void {
    let executeQuery: any = null;
    let mangoQuery: ExprDesc = null;
    const queryOptions: IElasticFindOptions = {
      passResults: true
    };
    if (this.options.queryOptions) {
      _.assign(queryOptions, this.options.queryOptions);
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
    if (!_.isEmpty(api.params.sorting)) {
      _d['sort'] = api.params.sorting;
    } else if (this.params.sorting) {
      _d['sort'] = this.params.sorting;
    }
    _.assign(queryOptions, _d);

    const filterQuery: ExprDesc[] = [];
    if (api.params && !_.isEmpty(api.params.filters)) {
      _.keys(api.params.filters).map(k => {
        if (!_.isEmpty(api.params.filters[k])) {
          filterQuery.push(api.params.filters[k]);
        }
      });
    }

    const selectedFacets = [];

    if (!_.isEmpty(this.facets)) {
      queryOptions.facets = {};
      for (const f of this.facets) {
        queryOptions.facets[f.field] = [
          <any>{name: f.name, type: f.type}
        ];

        if (f.results) {
          const selectedResults = f.results.filter(x => x.selected);
          if (!_.isEmpty(selectedResults)) {
            filterQuery.push(In(f.field, selectedResults.map(x => x.key)));
            selectedResults.forEach(x => {
              selectedFacets.push({name: f.name, key: x.key});
            });
          }
        }
      }
    }

    if (this.freeQuery) {
      if (_.isString(this.freeQuery)) {
        mangoQuery = Like(Key('_all'), Value(this.freeQuery));
        if (!_.isEmpty(mangoQuery)) {
          filterQuery.push(mangoQuery);
        }
      } else {
        mangoQuery = Expressions.fromJson(this.freeQuery);
        if (!_.isEmpty(mangoQuery)) {
          filterQuery.push(mangoQuery);
        }
      }
    }

    if (filterQuery.length > 1) {
      mangoQuery = And(...filterQuery);
    } else if (filterQuery.length === 1) {
      mangoQuery = filterQuery.shift();
    } else {
      mangoQuery = null;
    }


    if (mangoQuery) {
      executeQuery = mangoQuery.toJson();
    }

    this.getQueryService().query(this.name, executeQuery, queryOptions)
      .subscribe(
        (results: any) => {
          if (results) {
            if (results.entities && _.has(results, '$count') && _.isNumber(results.$count)) {
              if (_.has(results, '$facets')) {
                // results['$facets'];
                for (const f of results['$facets']) {
                  const entry = this.facets.find(x => x.name === f.name);
                  entry.results = f.values ? f.values : [];

                  selectedFacets.filter(x => x.name === f.name).forEach(x => {
                    const resultedEntry = entry.results.find(y => y.key === x.key);
                    if (resultedEntry) {
                      resultedEntry.selected = true;
                    }
                  });

                }
              }
              api.setRows(results.entities);
              api.setMaxRows(results.$count);
              api.rebuild();
            }
          }
        }
      );
  }


}
