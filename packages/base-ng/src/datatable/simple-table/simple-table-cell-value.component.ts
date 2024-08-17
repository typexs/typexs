import { isDate } from 'lodash';
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractSimpleTableCellComponent } from './abstract-simple-table-cell.component';


@Component({
  selector: 'txs-simple-html-cell-value',
  templateUrl: 'simple-table-cell-value.component.html'
})
export class SimpleTableCellValueComponent extends AbstractSimpleTableCellComponent {

  constructor(private datePipe: DatePipe) {
    super();
  }

  format(v: any) {
    if (isDate(v)) {
      return this.datePipe.transform(v, 'yyyy-MM-dd HH:mm:ss.SSS');
    } else {
      return v;
    }
  }
}
