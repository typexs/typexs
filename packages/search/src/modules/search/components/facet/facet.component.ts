import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ISearchFacet} from '../../../../lib/search/ISearchFacet';

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
    const entry = this.facet.results.find(x => x.key === data.key);
    if (entry.selected) {
      entry.selected = false;
    } else {
      entry.selected = true;
    }

    this.change.emit({name: this.facet.name, entry: entry});
  }

  label() {
    return _.upperFirst(this.facet.name);
  }

}

