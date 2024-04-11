import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DatatableComponent, IDatatableOptions } from '@typexs/base-ng';
import { IGridMode, K_PAGED, T_GRID_MODE } from '@typexs/base-ng/datatable/api/IGridMode';

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
    enablePager: true,
    maxRows: 200
  };

  @Input()
  viewModes: IGridMode[];

  @Output()
  optionsChange = new EventEmitter<IDatatableOptions>();

  // modeValues: { key: T_GRID_MODE }[] = [{ key: 'paged' }, { key: 'infinite' }, { key: 'view' }];

  ngOnInit() {
    this.update();
  }


  getGridModes(): IGridMode[] {
    return this.viewModes;
  }

  update() {
    this.optionsChange.emit(this.options);
  }

  updateLimit(nr: string) {
    if (!/\d+/.test(nr)) {
      return;
    }
    try {
      this.options.limit = parseInt(nr, 10);
      this.update();
    } catch (e) {
    }
  }


  updateRows($event: any) {
    if (!/\d+/.test($event)) {
      return;
    }
    const pre = parseInt($event, 10);
    if (this.options.maxRows !== pre) {
      this.options.maxRows = pre;
      this.update();
    }
  }
}
