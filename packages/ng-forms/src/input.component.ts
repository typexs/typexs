import {Component} from '@angular/core';
import {ViewComponent} from '@typexs/ng';
import {InputHandle} from '@typexs/ng';
import {AbstractFormComponent} from './component/AbstractFormComponent';


@ViewComponent('input')
@Component({
  selector: 'txs-input',
  templateUrl: './input.component.html',
})
export class InputComponent extends AbstractFormComponent<InputHandle>/* implements OnInit, OnChanges */ {

  get type() {
    return this.getInstance().variant;
  }


}
