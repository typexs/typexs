import { Component } from '@angular/core';
import { IGridColumn } from 'packages/base-ng/src';
import { SimpleHtmlTableComponent } from 'packages/base-ng/src';
import { AgGridWrapperComponent } from '../../addons/ag-grid/ag-grid-wrapper.component';


@Component({
  selector: 'tablesDemo',
  templateUrl: 'tables-demo.component.html'
})
export class TablesDemoComponent {

  simpleTableComp = SimpleHtmlTableComponent;

  agGridComp = AgGridWrapperComponent;

  staticdata_1 = {

    columns: <IGridColumn[]>[
      { label: 'Id', field: 'id' },
      { label: 'Name', field: 'name' }
    ],

    rows: [
      {
        id: 1,
        name: 'First'
      },
      {
        id: 2,
        name: 'Second'
      }
    ]
  };

}
