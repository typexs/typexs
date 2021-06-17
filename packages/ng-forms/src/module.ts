import {NgModule} from '@angular/core';
import {FormsModule as NgFormsModule} from '@angular/forms';
import {FORM_COMPONENTS} from './forms.elements';
import {FormService} from './form.service';
import {BaseModule} from '@typexs/base-ng';
import {CommonModule} from '@angular/common';
import {FORM_ELEMENTS} from '@typexs/ng';
import {AbstractFormComponent} from './component/AbstractFormComponent';


@NgModule({
  declarations: [
    AbstractFormComponent,
    ...FORM_COMPONENTS
  ],
  imports: [
    CommonModule,
    NgFormsModule,
    BaseModule
  ],
  entryComponents: FORM_COMPONENTS,
  exports: FORM_COMPONENTS,
  providers: [
    FormService
  ]
})
export class FormsModule {

  static forRoot() {
    return {
      ngModule: FormsModule,
      providers: [
        FormService
      ]
    };
  }

  constructor() {
    const load = FORM_ELEMENTS;
  }
}
