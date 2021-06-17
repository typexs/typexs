import {Component, HostBinding} from '@angular/core';
import {GridComponent} from './grid.component';
import {GridCellComponent} from './grid-cell.component';
import {NoFormTypeDefinedError} from '@typexs/ng';
import {FormObject, isFormObject} from '@typexs/ng';
import {Log} from '@typexs/base-ng';
import {AbstractFormComponent} from '../component/AbstractFormComponent';
import {AbstractComponent} from '@typexs/base-ng';

@Component({
  selector: 'txs-gridrow',
  templateUrl: './grid-row.component.html',
})
export class GridRowComponent extends AbstractFormComponent<any> {

  private grid: GridComponent;

  setGridComponent(grid: GridComponent) {
    this.grid = grid;
  }

  @HostBinding('class')
  get hostClasses(): string {
    return [
      'form-row'
    ].join(' ');
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

  build(form: FormObject): AbstractComponent<any>[] {
    const comp: AbstractComponent<any>[] = [];
    const columns = this.grid.columns;
    columns.forEach(column => {
      const formObject = column.elem;
      if (isFormObject(formObject)) {
        const handle = this.getComponentRegistry().getOrCreateDef(formObject.type);
        if (handle && handle.component) {

          const cGridCellFactory = this.r.resolveComponentFactory(GridCellComponent);
          const cGridCell = this.vc.createComponent(cGridCellFactory);
          cGridCell.instance.data = this.data;
          cGridCell.instance.setData(formObject, this.context);
          cGridCell.instance.setGridComponent(this.grid);

          if (cGridCell.instance.vc) {
            const factory = this.r.resolveComponentFactory(<any>handle.component);
            const ref = cGridCell.instance.vc.createComponent(factory);
            const instance = <AbstractFormComponent<any>>ref.instance;
            instance.data = this.data;
            if (column.value) {
              instance.setDefaultValue(column.value);
            }
            instance.setData(formObject, this.context);
            instance.build(formObject);
            comp.push(instance);
          } else {
            Log.error('No view content setted');
          }
        } else {
          throw new NoFormTypeDefinedError(formObject.type);
        }
      }
    });
    /*
    form.getChildren().forEach(formObject => {
      if (isFormObject(formObject)) {
        let handle = ContentComponentRegistry.$().getOrCreateDef(formObject.type);
        if (handle && handle.component) {

          let cGridCellFactory = this.r.resolveComponentFactory(GridCellComponent);
          let cGridCell = this.vc.createComponent(cGridCellFactory);
          cGridCell.instance.data = this.data;
          cGridCell.instance.setGridComponent(this.grid);
          cGridCell.instance.setData(formObject, this.context);

          if (cGridCell.instance.vc) {
            let factory = this.r.resolveComponentFactory(<any>handle.component);
            let ref = cGridCell.instance.vc.createComponent(factory);
            let instance = <AbstractFormComponent<any>>ref.instance;
            instance.data = this.data;
            instance.setData(formObject, this.context);
            instance.build(formObject);
            comp.push(instance);
          } else {
            Log.error('No view content setted');
          }
        } else {
          throw new NoFormTypeDefinedError(formObject.type);
        }
      }
    });
    */
    return comp;
  }

}
