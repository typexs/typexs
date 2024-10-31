import {get} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../api/IGridColumn';
import {IPropertyRef} from '@allgemein/schema-api';
import {C_PROPERTY, C_URL_HANDLER, C_URL_TITLE} from '../../constants';
import { Node } from '../../lib/datanodes/Node';
import { AbstractSimpleTableCellComponent } from './abstract-simple-table-cell.component';


@Component({
  selector: 'txs-simple-html-cell-router-link',
  templateUrl: 'simple-table-cell-router-link-renderer.component.html'
})
export class SimpleTableCellRouterLinkRendererComponent extends AbstractSimpleTableCellComponent  {

  //
  // getProperty(): IPropertyRef {
  //   return get(this.column, C_PROPERTY);
  // }


  getRouterLinkHandle(): (entry: any, row: any) => string[] {
    return get(this.column, C_URL_HANDLER);
  }


  getTitleHandle(): (entry: any, row: any) => string {
    return get(this.column, C_URL_TITLE);
  }

  routerLinkArray(entry: any) {
    return this.getRouterLinkHandle()(entry, this.getData());
  }

  title(e: any) {
    return this.getTitleHandle()(e, this.getData());
  }

  isEmpty() {
    return !this.getValue();
  }




}
