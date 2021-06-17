import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[txs-embed]',
})
export class EmbeddedContentDirective {


  constructor(public viewContainerRef: ViewContainerRef) {
  }

}
