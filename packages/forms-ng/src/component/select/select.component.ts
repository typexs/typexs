// noinspection AngularMissingOrInvalidDeclarationInModule

import { get, has, isArray, isString } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ViewComponent } from '@typexs/base/libs/bindings/decorators/ViewComponent';
import { AbstractFormComponent } from '../AbstractFormComponent';
import { EnumHandle } from '../../libs/EnumHandle';
import { isObservable } from 'rxjs';
import { K_LABEL, K_VALUE } from '../../constants';
import { ISelectOption, SelectHandle, Option } from '@typexs/forms';


@ViewComponent('select')
@Component({
  selector: 'txs-select',
  templateUrl: './select.component.html'
})
export class SelectComponent extends AbstractFormComponent<SelectHandle> implements OnInit {

  cachedOptions: Option[] = [];

  get supportsMultiple(): boolean {
    return this.getInstance().isMultiple();
  }


  static checkAndCreateOption(e: any) {
    const o = new Option();
    if (isString(e)) {
      o.label = o.value = e;
    } else if (has(e, K_LABEL) || has(e, K_VALUE)) {
      o.label = get(e, K_LABEL, get(e, K_VALUE));
      o.value = get(e, K_VALUE, get(e, K_LABEL));
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
    const enums = enumHandle.retrieveEnum(this.dataContainer, this.context.parent);

    if (enums) {

      if (isObservable(enums)) {
        enums.subscribe((e: ISelectOption[]) => {
          if (e) {
            this.cachedOptions = [];
            e.forEach(_e => {
              this.addCacheOption(_e);
            });
          }
        });
      } else if (isArray(enums)) {
        enums.forEach(e => {
          this.addCacheOption(e);
        });
      }
    }
  }
}
