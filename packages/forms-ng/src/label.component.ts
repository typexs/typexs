import {Component, Input} from '@angular/core';
import {ViewComponent} from '@typexs/base/libs/bindings/decorators/ViewComponent';
import {LabelHandle} from '@typexs/forms';
import {AbstractFormComponent} from './component/AbstractFormComponent';


@ViewComponent('label')
@Component({
  selector: 'txs-label',
  templateUrl: './label.component.html',
})
export class LabelComponent extends AbstractFormComponent<LabelHandle> {
}
