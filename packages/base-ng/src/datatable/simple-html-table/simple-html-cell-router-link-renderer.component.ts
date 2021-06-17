import {get} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../../datatable/IGridColumn';
import {IPropertyRef} from '@allgemein/schema-api';
import {C_PROPERTY, C_URL_HANDLER, C_URL_TITLE} from '../../constants';


@Component({
  selector: 'txs-simple-html-cell-router-link',
  templateUrl: 'simple-html-cell-router-link-renderer.component.html'
})
export class SimpleHtmlCellRouterLinkRendererComponent {

  @Input()
  column: IGridColumn;

  @Input()
  row: any;


  getProperty(): IPropertyRef {
    return get(this.column, C_PROPERTY);
  }


  getRouterLinkHandle(): (entry: any, row: any) => string[] {
    return get(this.column, C_URL_HANDLER);
  }


  getTitleHandle(): (entry: any, row: any) => string {
    return get(this.column, C_URL_TITLE);
  }

  routerLinkArray(entry: any) {
    return this.getRouterLinkHandle()(entry, this.row);
  }

  title(e: any) {
    return this.getTitleHandle()(e, this.row);
  }

  isEmpty() {
    return !this.getValue();
  }


  getValue() {
    if (this.column.valueHandler) {
      return this.column.valueHandler(this.row);
    } else if (this.getProperty()) {
      return this.getProperty().get(this.row);
    } else if (this.column.field) {
      return get(this.row, this.column.field);
    } else {
      return null;
    }
  }


}
