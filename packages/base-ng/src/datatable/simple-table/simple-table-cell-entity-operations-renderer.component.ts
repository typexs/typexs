import { get } from 'lodash';
import { Component, Input } from '@angular/core';
import { IGridColumn } from '../api/IGridColumn';
import { IEntityRef } from '@allgemein/schema-api';
import { C_ENTITY_REF, C_URL_HANDLER, C_URL_OP_DELETE, C_URL_OP_EDIT, C_URL_OP_VIEW, C_URL_OPS, C_URL_PREFIX } from '../../constants';
import { UrlHelper } from '../../lib/UrlHelper';
import { Node } from '../../lib/datanodes/Node';
import { AbstractSimpleTableCellComponent } from './abstract-simple-table-cell.component';


@Component({
  selector: 'txs-simple-html-cell-entity-operations',
  templateUrl: 'simple-table-cell-entity-operations-renderer.component.html'
})
export class SimpleTableCellEntityOperationsRendererComponent extends AbstractSimpleTableCellComponent {


  getOps(): string[] {
    return get(this.column, C_URL_OPS, [C_URL_OP_VIEW, C_URL_OP_EDIT, C_URL_OP_DELETE]);
  }


  getEntityRef(): IEntityRef {
    return get(this.column, C_ENTITY_REF);
  }

  getUrlPrefix(): string {
    return get(this.column, C_URL_PREFIX);
  }

  getRouterLink(type: string) {
    const handle = get(this.column, C_URL_HANDLER) as Function;
    if (handle) {
      return handle(type, this.column, this.row.data);
    }
    return [this.getUrlPrefix(), this.getEntityRef().name, type, this.buildLookupConditions(this.row.data)].filter(x => !!x);
  }

  buildLookupConditions(res: any) {
    const e = this.getEntityRef();
    return UrlHelper.buildLookupConditions(e, res);
  }


}
