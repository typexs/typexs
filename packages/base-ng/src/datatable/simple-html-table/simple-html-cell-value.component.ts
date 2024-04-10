import { get, isDate } from 'lodash';
import { Component, Input } from '@angular/core';
import { IGridColumn } from '../api/IGridColumn';
import { DatePipe } from '@angular/common';
import { Node } from '../../lib/datanodes/Node';
import { AbstractCellComponent } from './abstract-cell.component';


@Component({
  selector: 'txs-simple-html-cell-value',
  templateUrl: 'simple-html-cell-value.component.html'
})
export class SimpleHtmlCellValueComponent extends AbstractCellComponent {

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
