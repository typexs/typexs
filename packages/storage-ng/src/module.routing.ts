import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {STORAGE_ROUTES} from './routes';


@NgModule({
  imports: [RouterModule.forChild(STORAGE_ROUTES)],
  exports: [RouterModule]
})
export class StorageRoutingModule {
}
