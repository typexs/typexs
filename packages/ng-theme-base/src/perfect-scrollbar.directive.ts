import {Directive, ElementRef, Input, OnInit} from '@angular/core';
import PerfectScrollbar from 'perfect-scrollbar';


@Directive({
  exportAs: 'perfect-scrollbar',
  selector: '[perfect-scrollbar]',

})
export class PerfectScrollbarDirective implements OnInit {

  /**
   * Defines which element(s) or host must toggle which class
   */
  @Input('perfect-scrollbar')
  options: PerfectScrollbar.Options = null;

  perfectScrollbar: PerfectScrollbar;

  constructor(private ref: ElementRef) {
  }

  ngOnInit(): void {
    if (this.options) {
      this.perfectScrollbar = new PerfectScrollbar(this.ref.nativeElement, this.options);
    }
  }

}
