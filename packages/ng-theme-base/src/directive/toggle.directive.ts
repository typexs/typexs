import {concat, filter, isArray, isEmpty, isPlainObject, isString, keys, merge} from 'lodash';
import {Directive, ElementRef, HostListener, Input, Renderer2} from '@angular/core';

export interface ToggleSelector {
  [selector: string]: string | string[];
}

@Directive({
  exportAs: 'txs-toggle',
  selector: '[txs-toggle]',
})
export class ToggleDirective {

  /**
   * Defines which element(s) or host must toggle which class
   */
  @Input('txs-toggle')
  toggle: string | string[] | ToggleSelector | [string | string[], ToggleSelector];


  constructor(private renderer: Renderer2, private ref: ElementRef) {
  }


  @HostListener('click')
  onClick() {
    if (isString(this.toggle)) {
      this._toggleSelf(this.toggle);
    } else if (isArray(this.toggle)) {
      const hostToggleClassesArray: string[][] = <string[][]>filter(this.toggle, e => isArray(e));
      let hostToggleClasses: string[] = <string[]>filter(this.toggle, e => isString(e));
      const hostToggleRfes: ToggleSelector = merge({}, ...<ToggleSelector[]>filter(this.toggle, e => isPlainObject(e)));

      if (!isEmpty(hostToggleClassesArray)) {
        hostToggleClasses = concat(hostToggleClasses, ...hostToggleClassesArray);
      }

      if (!isEmpty(hostToggleClasses)) {
        this._toggleSelf(hostToggleClasses);
      }

      if (!isEmpty(hostToggleRfes)) {
        const _keys = keys(hostToggleRfes);
        for (const k of _keys) {
          this._toggleRef(k, hostToggleRfes[k]);
        }
      }
    }
  }


  private _toggleRef(ref: string, clazz: string | string[]) {
    let arr: string[] = [];
    if (!isArray(clazz)) {
      arr.push(clazz);
    } else {
      arr = clazz;
    }
    for (const c of arr) {
      const elem = document.querySelector(ref);
      const hasClass = elem.classList.contains(c);
      if (hasClass) {
        this.renderer.removeClass(elem, c);
      } else {
        this.renderer.addClass(elem, c);
      }
    }
  }


  private _toggleSelf(clazz: string | string[]) {
    let arr: string[] = [];
    if (!isArray(clazz)) {
      arr.push(clazz);
    } else {
      arr = clazz;
    }
    for (const c of arr) {
      const hasClass = this.ref.nativeElement.classList.contains(c);
      if (hasClass) {
        this.renderer.removeClass(this.ref.nativeElement, c);
      } else {
        this.renderer.addClass(this.ref.nativeElement, c);
      }
    }
  }


}
