import {Component, HostBinding} from '@angular/core';
import {GridComponent} from './grid.component';
import {GridColumnDef} from './GridColumnDef';
import {AbstractFormComponent} from '../component/AbstractFormComponent';


@Component({
  selector: 'txs-gridcell',
  templateUrl: './grid-cell.component.html',
})
export class GridCellComponent extends AbstractFormComponent<any> {

  private grid: GridComponent;

  private column: GridColumnDef;

  @HostBinding('class')
  get hostClasses(): string {
    return [
      'col'
    ].join(' ');
  }

  setGridComponent(grid: GridComponent) {
    this.grid = grid;
  }

  setColumn(column: GridColumnDef) {
    this.column = column;
  }


}
