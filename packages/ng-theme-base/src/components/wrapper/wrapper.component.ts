import {Component, ViewEncapsulation} from '@angular/core';

@Component({
  selector: '[bat-wrapper]',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {'class': 'wrapper'}
})
export class WrapperComponent {

}
