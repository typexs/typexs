import {get} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../../datatable/IGridColumn';
import {IPropertyRef} from '@allgemein/schema-api';
import {C_PROPERTY} from '../../constants';


@Component({
  selector: 'txs-simple-html-cell-object-reference',
  templateUrl: 'simple-html-cell-object-reference-renderer.component.html'
})
export class SimpleHtmlCellObjectReferenceRendererComponent {

  @Input()
  column: IGridColumn;

  @Input()
  row: any;


  getProperty(): IPropertyRef {
    return get(this.column, C_PROPERTY);
  }


  getValue() {
    if (this.column.valueHandler) {
      return this.column.valueHandler(this.row);
    } else if (this.getProperty()) {
      return this.getProperty().get(this.row);
    } else if (this.column.field) {
      return get(this.row, this.column.field);
    } else {
      return null;
    }
  }


}
