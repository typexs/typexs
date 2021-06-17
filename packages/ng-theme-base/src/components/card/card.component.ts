import {Component, Input} from '@angular/core';

@Component({
  selector: 'bat-card',
  templateUrl: './card.component.html'
})
export class CardComponent {

  @Input()
  title: string;

  @Input()
  bodyClasses: any = null;


}
