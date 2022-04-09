import { Component, HostBinding } from '@angular/core';
import { GridComponent } from './grid.component';
import { GridCellComponent } from './grid-cell.component';
import { FormObject, isFormObject, NoFormTypeDefinedError } from '@typexs/forms';
import { AbstractInstancableComponent, Log } from '@typexs/base-ng';
import { AbstractFormComponent } from '../component/AbstractFormComponent';

@Component({
  selector: 'txs-gridrow',
  templateUrl: './grid-row.component.html'
})
export class GridRowComponent extends AbstractFormComponent<any> {

  private grid: GridComponent;

  setGridComponent(grid: GridComponent) {
    this.grid = grid;
  }

  @HostBinding('class')
  get hostClasses(): string {
    // singe bootstrap 5.0 it is row
    return ['row'].join(' ');
  }

  getGrid() {
    return this.grid;
  }

  get idx() {
    return this.context.idx;
  }

  removeRow() {
    this.grid.removeRow(this.context.idx);
  }

  build(form: FormObject): AbstractInstancableComponent<any>[] {
    const comp: AbstractInstancableComponent<any>[] = [];
    const columns = this.grid.columns;
    columns.forEach(column => {
      const formObject = column.elem;
      if (isFormObject(formObject)) {
        const handle = this.getComponentRegistry().getOrCreateDef(formObject.type);
        if (handle && handle.component) {

          const cGridCellFactory = this.r.resolveComponentFactory(GridCellComponent);
          const cGridCell = this.vc.createComponent(cGridCellFactory);
          cGridCell.instance.setDataContainer(this.getDataContainer());
          cGridCell.instance.setData(formObject, this.context);
          cGridCell.instance.setGridComponent(this.grid);

          if (cGridCell.instance.vc) {
            const factory = this.r.resolveComponentFactory(<any>handle.component);
            const ref = cGridCell.instance.vc.createComponent(factory);
            const instance = <AbstractFormComponent<any>>ref.instance;
            instance.setDataContainer(this.getDataContainer());
            if (column.value) {
              instance.setDefaultValue(column.value);
            }
            instance.setData(formObject, this.context);
            instance.build(formObject);
            comp.push(instance);
          } else {
            Log.error('No view content present or bound.');
          }
        } else {
          throw new NoFormTypeDefinedError(formObject.type);
        }
      }
    });
    return comp;
  }

}
