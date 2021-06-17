import {isBoolean, remove} from 'lodash';
import {Component} from '@angular/core';
import {ViewComponent} from '@typexs/ng';
import {CheckboxHandle} from '@typexs/ng';
import {AbstractFormComponent} from './component/AbstractFormComponent';


@ViewComponent('checkbox')
@Component({
  selector: 'xcheckbox',
  templateUrl: './checkbox.component.html',
})
export class CheckboxComponent extends AbstractFormComponent<CheckboxHandle> {

  get type() {
    return this.getInstance().variant;
  }


  // TODO checked as boolean or value?
  get isChecked() {
    let value = this.getValue();

    if (this.getInstance().isMultiple()) {
      if (!value) {
        value = [];
      }
      return value.indexOf(this.defaultValue) !== -1;
    }
    return value;
  }


  set isChecked(checked: boolean) {
    const datatype = this.getInstance().getBinding().getType();
    if (this.getInstance().isMultiple()) {
      let value = this.getValue();
      if (!value) {
        value = [];
      }
      if (value.indexOf(this.defaultValue) === -1) {
        value.push(this.defaultValue);
      } else {
        remove(value, v => this.defaultValue === v);
      }
      this.setValue(value);
    } else {

      if (datatype === 'boolean') {
        const v = this.getValue();
        if (isBoolean(v)) {
          this.setValue(!v);
        } else {
          this.setValue(true);
        }
      } else if (datatype === 'string') {
        if (checked) {
          this.setValue(this.defaultValue);
        } else {
          this.setValue(null);
        }
      }
    }
  }
}
