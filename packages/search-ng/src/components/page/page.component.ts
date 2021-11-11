import { Component } from '@angular/core';
import { AppService, C_DEFAULT, IDTGridOptions, ListViewComponent } from '@typexs/base-ng';
import { DEFAULT_FACET, ISearchFacet, SEARCH_PAGE, TXS_SEARCH } from '@typexs/search';
import { __CLASS__, __NS__ } from '@allgemein/schema-api';

/**
 * Component that contains a search input and a list of search results
 */
@Component({
  selector: 'txs-search-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.scss']
})
export class SearchPageComponent {

  options: IDTGridOptions = {};

  gridComponentClass = ListViewComponent;


  facets: ISearchFacet[] = [];


  constructor(private appService: AppService) {
    this.facets = appService.getSettings(
      [
        TXS_SEARCH, SEARCH_PAGE, C_DEFAULT, DEFAULT_FACET
      ].join('.'),
      [
        { name: 'Class', type: 'value', field: __CLASS__ + '.keyword' },
        { name: 'Namespace', type: 'value', field: __NS__ + '.keyword' }
      ]
    );
  }


}

