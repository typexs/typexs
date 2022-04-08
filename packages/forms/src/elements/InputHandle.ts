import {ViewContent} from '@typexs/base/libs/bindings/decorators/ViewContent';
import {FormObject} from '../lib/FormObject';

@ViewContent('input')
export class InputHandle extends FormObject {

  variant: string = 'text';


  handleVariant(value: string) {
    this.variant = value;
  }

}
