import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { IDatatableOptions } from 'packages/base-ng/src';
import { GRID_MODE, K_PAGED } from 'packages/base-ng/src/datatable/Constants';

/**
 * Component allowing configure options
 */
@Component({
  selector: 'datatable-options',
  templateUrl: 'datatable-options.component.html',
  styleUrls: ['./datatable-options.component.scss']
})
export class DatatableOptionsComponent implements OnInit {

  // @Input()
  options: IDatatableOptions & { maxRows: number } = {
    mode: K_PAGED,
    pagerId: 'page',
    limit: 20,
    enablePager: true,
    maxRows: 20
  };

  @Output()
  optionsChange = new EventEmitter<IDatatableOptions>();

  modeValues: { key: GRID_MODE }[] = [{ key: 'paged' }, { key: 'infinite' }, { key: 'view' }];

  ngOnInit() {
    console.log('init');
    this.update();
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


  // ngOnChanges(changes: SimpleChanges) {
  //   console.log(changes);
  // }

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
