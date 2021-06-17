import {Component} from '@angular/core';
import {AbstractGridComponent} from '@typexs/base-ng';


export interface IAgGridColumn {
  headerName: string;
  field: string;
}

@Component({
  selector: 'txs-ag-grid',
  templateUrl: 'ag-grid-wrapper.component.html',
  styleUrls: ['./ag-grid-wrapper.component.scss']
})
export class AgGridWrapperComponent extends AbstractGridComponent {

  get columnDefs() {
    return this.columns.map(column => {
      return <IAgGridColumn>{
        headerName: column.label,
        field: column.field
      };
    });
  }


  rebuild() {

  }
}
