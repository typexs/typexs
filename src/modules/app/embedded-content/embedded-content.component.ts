import {AfterViewInit, Component, Input, QueryList, TemplateRef, ViewChildren} from '@angular/core';
import {EmbeddedContentDirective} from './embedded-content.directive';


@Component({
  selector: '[embedded]',
  templateUrl: './embedded-content.component.html'
})
export class EmbeddedContentComponent implements AfterViewInit {

  @Input('embedded')
  ref: TemplateRef<any>;
  //@ViewChild('inline')


  @ViewChildren(EmbeddedContentDirective)
  private queryList: QueryList<EmbeddedContentDirective>;

  ngAfterViewInit(): void {
    this.queryList.map(d => {
      d.viewContainerRef.createEmbeddedView(this.ref);
    })
  }
}
