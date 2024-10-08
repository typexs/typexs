import {get} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../api/IGridColumn';
import {IPropertyRef} from '@allgemein/schema-api';
import {C_PROPERTY} from '../../constants';
import { Node } from '../../lib/datanodes/Node';
import { AbstractSimpleTableCellComponent } from './abstract-simple-table-cell.component';


@Component({
  selector: 'txs-simple-html-cell-object-reference',
  templateUrl: 'simple-table-cell-object-reference-renderer.component.html'
})
export class SimpleTableCellObjectReferenceRendererComponent extends AbstractSimpleTableCellComponent {
  //
  // @Input()
  // column: IGridColumn;
  //
  // @Input()
  // row: Node<any>;
  //
  //
  // getProperty(): IPropertyRef {
  //   return get(this.column, C_PROPERTY);
  // }
  //

  // getValue() {
  //   if (this.column.valueHandler) {
  //     return this.column.valueHandler(this.row.data);
  //   } else if (this.getProperty()) {
  //     return this.getProperty().get(this.row.data);
  //   } else if (this.column.field) {
  //     return get(this.row.data, this.column.field);
  //   } else {
  //     return null;
  //   }
  // }


}
