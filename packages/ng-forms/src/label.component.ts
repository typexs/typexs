import {Component, Input} from '@angular/core';
import {ViewComponent} from '@typexs/ng';
import {LabelHandle} from '@typexs/ng';
import {AbstractFormComponent} from './component/AbstractFormComponent';


@ViewComponent('label')
@Component({
  selector: 'txs-label',
  templateUrl: './label.component.html',
})
export class LabelComponent extends AbstractFormComponent<LabelHandle> {
}
