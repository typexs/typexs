import {Component} from '@angular/core';
import {Person} from '../../../entities/Person';
import {IInstanceableComponent} from '@typexs/base-ng';


@Component({
  selector: 'app-person',
  templateUrl: 'person.component.html',
  styleUrls: ['./person.component.scss']

})
export class PersonComponent implements IInstanceableComponent<Person> {

  instance: Person;

  getInstance(): any {
    return this.instance;
  }

  setInstance(instance: Person) {
    this.instance = instance;
  }
}
