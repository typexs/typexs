
import {FormObject} from '../FormObject';
import {ViewContent} from '../../views/decorators/ViewContent';

@ViewContent('input')
export class InputHandle extends FormObject {

  variant: string = 'text';


  handleVariant(value: string) {
    this.variant = value;
  }

}
