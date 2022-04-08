import {Injectable} from '@angular/core';
import {ISelectOptionsService} from '@typexs/forms-ng';
import {PropertyRef} from '@typexs/entity/libs/registry/PropertyRef';
import {BehaviorSubject, Observable} from 'rxjs';
import { ISelectOption } from '@typexs/forms';

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

