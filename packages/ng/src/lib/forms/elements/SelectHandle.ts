import {FormObject} from '../FormObject';
import {ViewContent} from '../../views/decorators/ViewContent';

@ViewContent('select')
export class SelectHandle extends FormObject {

  enum: any;

}
