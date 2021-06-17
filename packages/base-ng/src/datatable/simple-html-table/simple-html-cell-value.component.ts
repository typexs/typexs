import {get, isDate} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../IGridColumn';
import {DatePipe} from '@angular/common';


@Component({
  selector: 'txs-simple-html-cell-value',
  templateUrl: 'simple-html-cell-value.component.html'
})
export class SimpleHtmlCellValueComponent {

  @Input()
  column: IGridColumn;

  @Input()
  row: any;

  constructor(private datePipe: DatePipe) {

  }


  getValue() {
    if (this.column.valueHandler) {
      return this.column.valueHandler(this.row);
    } else if (this.column.field) {
      const v = get(this.row, this.column.field);
      return v;
    } else {
      return null;
    }
  }

  format(v: any) {
    if (isDate(v)) {
      return this.datePipe.transform(v, 'yyyy-MM-dd HH:mm:ss.SSS');
    } else {
      return v;
    }
  }
}
