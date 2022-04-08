import {FormObject} from '../lib/FormObject';
import {ViewContent} from '@typexs/base/libs/bindings/decorators/ViewContent';
@ViewContent('select')
export class SelectHandle extends FormObject {

  enum: any;

}
