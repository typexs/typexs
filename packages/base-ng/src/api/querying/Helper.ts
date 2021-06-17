import {first, isFunction, keys} from 'lodash';
import {IGridColumn} from '../../datatable/IGridColumn';
import {C_$LABEL, C_LABEL} from './Constants';
import {IClassRef} from '@allgemein/schema-api';


export class Helper {
  static rebuildColumns(data: any[]) {
    const _first = first(data);
    const columns = [];
    for (const k of keys(_first)) {
      const column: IGridColumn = {
        label: k,
        field: k,
        sorting: true
      };
      columns.push(column);
    }
    return columns;
  }

  static label(entity: any, ref: IClassRef, sep: string = ' ', max: number = 1024): string {
    if (Reflect.has(entity, C_LABEL)) {
      if (isFunction(entity[C_LABEL])) {
        return entity.label();
      } else {
        return entity.label;
      }
    } else if (Reflect.has(entity, C_$LABEL)) {
      return entity[C_$LABEL];
    } else {
      // create label from data
      const label: string[] = [];
      ref.getPropertyRefs().forEach(p => {
        if (!p.isReference()) {
          label.push(p.get(entity));
        }
      });

      const str = label.join(sep);
      if (str.length > max) {
        return str.substring(0, max);
      }
      return str;
    }
  }

}
