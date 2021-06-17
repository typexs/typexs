import {Component, OnInit} from '@angular/core';
import {Person} from '../../entities/Person';
import {Book} from '../../entities/Book';
import {C_DEFAULT} from '@typexs/base-ng';


@Component({
  selector: 'simple-view-variants',
  templateUrl: 'simple-view-variants.component.html'
})
export class SimpleViewVariantsComponent implements OnInit {

  person1: Person = new Person();

  book1: Book = new Book();

  book1Context: string = C_DEFAULT;

  unknown1: any = {};


  ngOnInit() {

    this.person1.firstName = 'Robert';
    this.person1.lastName = 'Jefferson';

    this.unknown1 = {
      firstName: 'Robert',
      lastName: 'Mueller'
    };

    this.book1.author = this.person1;
    this.book1.title = 'Long way hacking';
  }

}
