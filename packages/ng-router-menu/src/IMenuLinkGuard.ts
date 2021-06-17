import {NavEntry} from './NavEntry';
import {Observable} from 'rxjs';

export interface IMenuLinkGuard {

  isDisabled?(entry: NavEntry): Observable<boolean>;

  isShown?(entry: NavEntry): Observable<boolean>;
}
