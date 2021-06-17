import {Component} from '@angular/core';
import {IInstanceableComponent} from '@typexs/base-ng';
import {Book} from '../../../entities/Book';


@Component({
  selector: 'app-book',
  templateUrl: 'book.component.html',
  styleUrls: ['./book.component.scss']

})
export class BookComponent implements IInstanceableComponent<Book> {

  instance: Book;

  viewMode: string;

  static supportedViewModes() {
    return ['teaser', 'full'];
  }

  getViewContext(): string {
    return this.viewMode;
  }

  setViewContext(context: string) {
    this.viewMode = context;
  }

  getInstance(): any {
    return this.instance;
  }

  setInstance(instance: Book) {
    this.instance = instance;
  }
}
