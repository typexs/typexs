import { Observable } from 'rxjs';
import { IPropertyRef } from '@allgemein/schema-api';
import { ISelectOption } from '@typexs/ng/lib/forms/elements/ISelectOption';
export { ISelectOption };


export interface ISelectOptionsService {

  options(property: IPropertyRef): Observable<ISelectOption[]>;

}
