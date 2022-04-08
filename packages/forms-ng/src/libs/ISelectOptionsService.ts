import { Observable } from 'rxjs';
import { IPropertyRef } from '@allgemein/schema-api';
import { ISelectOption } from '@typexs/forms';


export interface ISelectOptionsService {

  options(property: IPropertyRef): Observable<ISelectOption[]>;

}
