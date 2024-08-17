import { Directive, Input, TemplateRef } from '@angular/core';


@Directive({
  selector: '[viewTemplate]'
})
export class TemplateDirective {
  @Input('viewTemplate') name: string;

  constructor(public template: TemplateRef<any>) {
  }
}
