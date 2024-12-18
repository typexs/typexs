import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ISearchFacet } from '@typexs/search';
import { upperFirst } from '@typexs/generic';


/**
 * Component that contains a search input and a list of search results
 */
@Component({
  selector: 'txs-search-facet',
  templateUrl: './facet.component.html',
  styleUrls: ['./facet.component.scss']
})
export class SearchFacetComponent {

  @Input()
  facet: ISearchFacet;

  @Output()
  change: EventEmitter<any> = new EventEmitter<any>();

  click(data: any) {
    const entry = this.facet.results.find((x: any) => x.key === data.key);
    if (entry.selected) {
      entry.selected = false;
    } else {
      entry.selected = true;
    }
    this.change.emit({ name: this.facet.name, entry: entry });
  }
  label() {
    return upperFirst(this.facet.name);
  }

}

