import { Component } from '@angular/core';
import { ViewComponent } from '@typexs/base/libs/bindings/decorators/ViewComponent';
import { InputHandle } from '@typexs/forms';
import { AbstractFormComponent } from './component/AbstractFormComponent';


@ViewComponent('input')
@Component({
  selector: 'txs-input',
  templateUrl: './input.component.html'
})
export class InputComponent extends AbstractFormComponent<InputHandle>/* implements OnInit, OnChanges */ {

  get type() {
    return this.getInstance().variant;
  }


}
