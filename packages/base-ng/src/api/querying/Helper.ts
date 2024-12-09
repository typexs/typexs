import { first, keys } from 'lodash';
import { IGridColumn } from '../../datatable/api/IGridColumn';


export class Helper {
  static rebuildColumns(data: any[]) {
    const _first = first(data);
    const columns = [];
    for (const k of  Object.keys(_first)) {
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
