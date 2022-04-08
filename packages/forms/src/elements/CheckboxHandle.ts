import {InputHandle} from './InputHandle';
import {ViewContent} from '@typexs/base/libs/bindings/decorators/ViewContent';

@ViewContent('checkbox')
export class CheckboxHandle extends InputHandle {

  enum: any;

  postProcess() {
    super.postProcess();
    if (this.isMultiple() && this.isSelection()) {
      this.handle('replicable', true);
    }
  }

}
