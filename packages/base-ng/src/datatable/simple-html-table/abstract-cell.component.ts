import { Component, Input } from '@angular/core';
import { IGridColumn } from '../api/IGridColumn';
import { Node } from '../../lib/datanodes/Node';
import { get } from 'lodash';
import { IPropertyRef } from '@allgemein/schema-api';
import { C_PROPERTY } from '../../constants';


@Component({
  template: ''
})
export class AbstractCellComponent {

  @Input()
  column: IGridColumn;

  @Input()
  row: Node<any>;


  getProperty(): IPropertyRef {
    return get(this.column, C_PROPERTY, null);
  }


  getData() {
    if (this.row) {
      return this.row.data;
    } else {
      return undefined;
    }
  }


  // getValue() {
  //   if (this.column.valueHandler) {
  //     return this.column.valueHandler(this.row.data);
  //   } else if (this.column.field) {
  //     const v = get(this.row.data, this.column.field);
  //     return v;
  //   } else {
  //     return null;
  //   }
  // }


  getValue() {
    if (this.column.valueHandler) {
      return this.column.valueHandler(this.getData());
    } else if (this.getProperty()) {
      return this.getProperty().get(this.getData());
    } else if (this.column.field) {
      return get(this.getData(), this.column.field);
    } else {
      return null;
    }
  }

}
