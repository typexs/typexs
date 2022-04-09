import { Component } from '@angular/core';
import { RadioHandle } from '@typexs/forms';
import { ViewComponent } from '@typexs/base/libs/bindings/decorators/ViewComponent';
import { AbstractFormComponent } from './component/AbstractFormComponent';


@ViewComponent('radio')
@Component({
  selector: 'txs-radio',
  templateUrl: './radio.component.html'
})
export class RadioComponent extends AbstractFormComponent<RadioHandle> {

  on: string = 'Yes';

  off: string = 'No';

  get type() {
    return this.getInstance().variant;
  }

  get isChecked() {
    return this.getDataContainer().instance[this.name];
  }

  set isChecked(value: boolean) {
    if (value) {
      this.getDataContainer().instance[this.name] = true;
    } else {
      this.getDataContainer().instance[this.name] = false;
    }
  }
}
