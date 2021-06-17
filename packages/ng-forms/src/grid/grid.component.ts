import {first, get, isEmpty, set} from 'lodash';
import {Component, ComponentRef, OnInit} from '@angular/core';
import {GridRowComponent} from './grid-row.component';
import {FormObject, GridHandle, isFormObject, ViewComponent} from '@typexs/ng';
import {Observable} from 'rxjs';
import {GridColumnDef} from './GridColumnDef';
import {AbstractFormComponent} from '../component/AbstractFormComponent';
import {AbstractComponent} from '@typexs/base-ng';
import {EnumHandle} from '../libs/EnumHandle';


@ViewComponent('grid')
@Component({
  selector: 'txs-grid',
  templateUrl: 'grid.component.html',
})
export class GridComponent extends AbstractFormComponent<GridHandle> implements OnInit {


  entries: ComponentRef<GridRowComponent>[] = [];

  columns: GridColumnDef[] = [];


  ngOnInit() {
  }

  showNr() {
    return this.getInstance().options.nr;
  }

  isFixed() {
    return this.getInstance().options.fixed;
  }

  analyse() {
  }

  private findColumns(form: FormObject, tmpObj: any = null) {
    form.getChildren().forEach(obj => {
      if (isFormObject(obj)) {
        //
        if (obj.isReplicable()) {
          // it is so has enum select + multiple but one-decision element like checkbox or radio
          if (!tmpObj) {
            tmpObj = obj.getBinding().getClassRef().create();
          }

          const enumHandle = new EnumHandle(this.injector, obj);
          const obs = enumHandle.retrieveEnum(tmpObj);
          if (obs instanceof Observable) {
            throw new Error('TODO handle observable');
          } else {
            let idx = 0;
            obs.forEach(o => {
              const def = new GridColumnDef();
              def.idx = idx++;
              def.label = o.label;
              def.value = o.value;
              def.elem = obj;
              this.columns.push(def);
            });
          }
        } else {
          const def = new GridColumnDef();
          // def.label = obj.label;
          def.elem = obj;
          this.columns.push(def);
        }

      }
    });
  }


  build(form: FormObject): AbstractComponent<any>[] {
    this.context.labelDisplay = 'none';
    const dataEntries = this.getInstance().getBinding().get(this.data.instance);
    this.findColumns(form, first(dataEntries));

    const ret = [];
    if (!isEmpty(dataEntries)) {
      for (let i = 0; i < dataEntries.length; i++) {
        const c = this.addRow(dataEntries[i], i);
        ret.push(c);
      }
    }

    // TODO append lines
    if (!this.isFixed()) {
      const c = this.addRow();
      ret.push(c);

    }
    return ret;
  }

  addRow(row: any = null, index: number = -1) {
    const factory = this.r.resolveComponentFactory(GridRowComponent);
    const cGridRow = this.vc.createComponent(factory);
    cGridRow.instance.data = this.data;
    cGridRow.instance.setGridComponent(this);
    cGridRow.instance.setData(this.getInstance(), this.context, this.entries.length);
    this.entries.push(cGridRow);

    if (!row) {
      const object = Reflect.construct(this.getInstance().getBinding().getTargetRef().getClass(), []);
      const path = this.context.path();

      if (this.getInstance().isMultiple()) {
        let arraySetted = get(this.data.instance, path, null);
        if (!arraySetted) {
          arraySetted = [];
        }
        arraySetted[cGridRow.instance.context.idx] = object;
        set(this.data.instance, path, arraySetted);
      } else {
        set(this.data.instance, path, object);
      }

    }

    cGridRow.instance.build(this.getInstance());
    return cGridRow.instance;
  }


  removeRow(idx: number) {
    // TODO check if exists
    const path = this.context.path();

    const components = this.entries.splice(idx, 1);
    const component = components.shift();

    this.vc.remove(idx);
    if (this.getInstance().getBinding().isCollection()) {
      let arraySetted = get(this.data.instance, path, null);
      if (!arraySetted) {
        arraySetted = [];
      }
      arraySetted.splice(idx, 1);

      set(this.data.instance, path, arraySetted);
    } else {
      set(this.data.instance, path, null);
    }

    for (let i = this.entries.length - 1; i >= 0; i--) {
      this.entries[i].instance.context.idx = i;
    }
    component.destroy();
  }


}
