import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {SEARCH_ROUTES} from './routes';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {BaseAdminThemeModule, BaseModule, StorageModule} from '@typexs/ng-base';
import {MomentModule} from 'ngx-moment';
import {SearchEmbeddedComponent} from './components/embedded/embedded.component';
import {SearchPageComponent} from './components/page/page.component';
import {SearchFacetComponent} from './components/facet/facet.component';
import {SearchQueryFormComponent} from './components/query-form/query-form.component';
import {CommonModule} from '@angular/common';

@NgModule({
  declarations: [
    SearchEmbeddedComponent,
    SearchPageComponent,
    SearchFacetComponent,
    SearchQueryFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    BaseModule,
    MomentModule,
    BaseAdminThemeModule,
    StorageModule
  ],
  entryComponents: [],
  exports: [
    SearchEmbeddedComponent,
    SearchPageComponent
  ],
  providers: []

})
export class SearchModule {

  static getRoutes() {
    return SEARCH_ROUTES;
  }
}
