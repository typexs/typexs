import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LazyDummyComponent} from './dummy.component';
import {LazyRoutingModule} from './routing-module';

@NgModule({
  declarations: [LazyDummyComponent],
  imports: [
    CommonModule,
    LazyRoutingModule
  ],
  exports: [LazyDummyComponent]

})
export class LazyModule {

  static forRoot() {
    return {
      ngModule: LazyModule,
    };
  }


}
