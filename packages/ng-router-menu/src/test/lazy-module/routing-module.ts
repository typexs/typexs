import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LazyDummyComponent} from './dummy.component';


const ROUTES: Routes = [
  {path: 'lazy-route-first', component: LazyDummyComponent},
  {path: 'lazy-route-second', component: LazyDummyComponent},
  {
    path: 'lazy-route-with-children', children: [
      {path: 'child-first', component: LazyDummyComponent},
      {path: 'child-second', component: LazyDummyComponent},
    ]
  },
  {
    path: 'lazy-route-with-children-sibiling/child-first-sib', component: LazyDummyComponent
  },
  {
    path: 'lazy-route-with-children-sibiling/child-second-sib', component: LazyDummyComponent
  }


];

@NgModule({
  imports: [RouterModule.forChild(ROUTES)],
  exports: [RouterModule]
})
export class LazyRoutingModule {
}
