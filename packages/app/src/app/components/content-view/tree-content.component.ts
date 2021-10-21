import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {SearchEntry} from './search/search-entry.component';
import {SearchResult} from './search/search-result.component';
import {Person} from '../../entities/Person';
import {BookShop} from '../../entities/BookShop';
import {Book} from '../../entities/Book';
import {Places} from '../../entities/Places';


@Component({
  selector: 'contentDemo',
  templateUrl: 'tree-content.component.html',
  styleUrls: ['tree-content.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TreeContentComponent implements OnInit {
  treeContent: any;

  ngOnInit() {
    const entities: any = [
      new Person(),
      new BookShop(),
      new Person(),
      new Book(),
      new Places()
    ];

    (entities[0] as Person).firstName = 'Robert';
    (entities[0] as Person).lastName = 'Jefferson';

    (entities[2] as Person).firstName = 'Lyne';
    (entities[2] as Person).lastName = 'Wilkinson';

    this.treeContent = new SearchResult();

    this.treeContent.children.push(new SearchEntry(1, entities[0]));
    this.treeContent.children.push(new SearchEntry(2, entities[1]));

    setTimeout(() => {
      this.treeContent = new SearchResult();
      this.treeContent.children.push(new SearchEntry(1, entities[0]));
      this.treeContent.children.push(new SearchEntry(2, entities[1]));
      this.treeContent.children.push(new SearchEntry(3, entities[2]));
      this.treeContent.children.push(new SearchEntry(4, entities[3]));
      this.treeContent.children.push(new SearchEntry(5, entities[4]));
    }, 5000);
  }

  onSubmit($event: any) {

  }
}
