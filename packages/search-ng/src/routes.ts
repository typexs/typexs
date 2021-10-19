import {Routes} from '@angular/router';
import {AuthGuardService} from '@typexs/base-ng';
import {SearchPageComponent} from './components/page/page.component';
import {PERMISSION_ACCESS_SEARCH_VIEW} from '@typexs/search';

export const SEARCH_ROUTES: Routes = [
  {
    path: 'search',
    component: SearchPageComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Suche', isAuthenticated: true, permissions: [PERMISSION_ACCESS_SEARCH_VIEW]}
  }
];
