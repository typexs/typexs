import {Injectable} from '@angular/core';
import {ISelectOption, ISelectOptionsService} from '@typexs/ng-forms';
import {PropertyRef} from '@typexs/schema/libs/registry/PropertyRef';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable()
export class OptionsService implements ISelectOptionsService {

  favoredMusicTypes: ISelectOption[] = [
    {'label': 'Indie', 'value': 'indie'},
    {'label': 'Blues', 'value': 'Blues'}
  ];


  options(property: PropertyRef): Observable<ISelectOption[]> {
    return (new BehaviorSubject(this.favoredMusicTypes)).asObservable();
  }


}

