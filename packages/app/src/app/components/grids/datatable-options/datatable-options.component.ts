import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DatatableComponent, IDatatableOptions } from '@typexs/base-ng';
import { IGridMode, K_PAGED, T_GRID_MODE } from '@typexs/base-ng/datatable/api/IGridMode';
import { cloneDeep } from 'lodash';

/**
 * Component allowing configure options
 */
@Component({
  selector: 'datatable-options',
  templateUrl: 'datatable-options.component.html',
  styleUrls: ['./datatable-options.component.scss']
})
export class DatatableOptionsComponent implements OnInit {

  @Input()
  options: IDatatableOptions = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 10,
    enablePager: true
  };

  @Input()
  maxRows: number = undefined;
  @Output()
  maxRowsChange: EventEmitter<number> = new EventEmitter();


  @Input()
  viewModes: IGridMode[];

  @Output()
  optionsChange = new EventEmitter<IDatatableOptions & { _update: any }>();


  ngOnInit() {
    this.update();
  }


  getGridModes(): IGridMode[] {
    return this.viewModes;
  }

  update(key?: string, value?: any) {
    const options = Object.assign(cloneDeep(this.options), { _update: { key: key, value: value } });

    this.optionsChange.emit(options);
  }

  updateLimit(nr: string) {
    if (!/\d+/.test(nr)) {
      return;
    }
    try {
      this.options.limit = parseInt(nr, 10);
      this.update('limit', nr);
    } catch (e) {
    }
  }


  updateRows($event: any) {
    this.maxRowsChange.emit($event);
  }
}
