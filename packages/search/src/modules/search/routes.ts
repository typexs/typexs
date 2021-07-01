import {Routes} from '@angular/router';
import {AuthGuardService} from '@typexs/ng-base';
import {SearchPageComponent} from './components/page/page.component';
import {PERMISSION_ACCESS_SEARCH_VIEW} from '../../lib/Constants';

export const SEARCH_ROUTES: Routes = [
  {
    path: 'search',
    component: SearchPageComponent,
    canActivate: [AuthGuardService],
    data: {label: 'Suche', isAuthenticated: true, permissions: [PERMISSION_ACCESS_SEARCH_VIEW]}
  }
];
