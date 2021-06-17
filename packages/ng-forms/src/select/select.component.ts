import {get, has, isArray, isString} from 'lodash';
import {Component, OnInit} from '@angular/core';


import {Option, SelectHandle, ViewComponent} from '@typexs/ng';
import {AbstractFormComponent} from '../component/AbstractFormComponent';
import {ISelectOption} from '../libs/ISelectOption';
import {EnumHandle} from '../libs/EnumHandle';


@ViewComponent('select')
@Component({
  selector: 'txs-select',
  templateUrl: './select.component.html',
})
export class SelectComponent extends AbstractFormComponent<SelectHandle> implements OnInit {


  get supportsMultiple(): boolean {
    return this.getInstance().isMultiple();
  }


  cachedOptions: Option[] = [];

  static checkAndCreateOption(e: any) {
    const o = new Option();
    if (isString(e)) {
      o.label = o.value = e;
    } else if (has(e, 'label') || has(e, 'value')) {
      o.label = get(e, 'label', get(e, 'value'));
      o.value = get(e, 'value', get(e, 'label'));
    } else {
      throw new Error('not found');
    }
    return o;
  }

  ngOnInit() {
    this.cachedOptions = [];
    this.loadOptions();
  }

  selectFirst(o: Option) {
    if (!this.supportsMultiple && !this._value) {
      // TODO default value?
      this.value = o.value;
    }
  }


  addCacheOption(iso: ISelectOption) {
    const o = SelectComponent.checkAndCreateOption(iso);
    this.selectFirst(o);
    this.cachedOptions.push(o);
  }

  loadOptions() {

    const enumHandle = new EnumHandle(this.injector, this.getInstance());
    const enums = enumHandle.retrieveEnum(this.data, this.context.parent);

    if (enums) {

      if (!isArray(enums)) {
        enums.subscribe((e: ISelectOption[]) => {
          if (e) {
            this.cachedOptions = [];
            e.forEach(_e => {
              this.addCacheOption(_e);
            });
          }
        });
      } else {
        enums.forEach(e => {
          this.addCacheOption(e);
        });
      }
    }
  }
}
