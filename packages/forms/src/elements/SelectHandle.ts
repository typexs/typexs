import { FormObject } from '../lib/FormObject';
import { ViewContent } from '@typexs/base/libs/bindings/decorators/ViewContent';
import { K_SELECT } from '../lib/Constants';

@ViewContent(K_SELECT)
export class SelectHandle extends FormObject {

  enum: any;

}
