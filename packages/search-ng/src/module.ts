import { NgModule } from '@angular/core';
import { SEARCH_ROUTES } from './routes';
import { FormsModule } from '@angular/forms';
import { BaseModule } from '@typexs/base-ng';
import { SearchEmbeddedComponent } from './components/embedded/search-embedded.component';
import { SearchPageComponent } from './components/page/page.component';
import { SearchFacetComponent } from './components/facet/facet.component';
import { SearchQueryFormComponent } from './components/query-form/query-form.component';
import { CommonModule } from '@angular/common';
import { BaseAdminThemeModule } from '@typexs/ng-theme-base';
import { StorageModule } from '@typexs/storage-ng';
import { SearchFacetsComponent } from './components/facets/facets.component';


const COMPONENTS = [
  SearchEmbeddedComponent,
  SearchPageComponent,
  SearchFacetComponent,
  SearchFacetsComponent,
  SearchQueryFormComponent
];

@NgModule({
  declarations: COMPONENTS,
  imports: [
    CommonModule,
    FormsModule,
    BaseModule,
    BaseAdminThemeModule,
    StorageModule
  ],
  exports: COMPONENTS,
  providers: []
  // schemas: [CUSTOM_ELEMENTS_SCHEMA]

})
export class SearchModule {

  static getRoutes() {
    return SEARCH_ROUTES;
  }
}
