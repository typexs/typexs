import {Observable} from 'rxjs';
import {ISelectOption} from './ISelectOption';
import {IPropertyRef} from '@allgemein/schema-api';


export interface ISelectOptionsService {

  options(property: IPropertyRef): Observable<ISelectOption[]>;

}
