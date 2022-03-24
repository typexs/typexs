import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ISearchFacet } from '@typexs/search';

/**
 * Component that contains a search input and a list of search results
 */
@Component({
  selector: 'txs-search-facets',
  templateUrl: './facets.component.html',
  styleUrls: ['./facets.component.scss']
})
export class SearchFacetsComponent {

  display: boolean = false;

  @Input()
  facets: ISearchFacet[] = [];

  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  onFacetChange($event: any) {
    this.change.emit($event);
  }

}

