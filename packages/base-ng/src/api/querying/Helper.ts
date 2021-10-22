import { first, keys } from 'lodash';
import { IGridColumn } from '../../datatable/IGridColumn';


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

}
