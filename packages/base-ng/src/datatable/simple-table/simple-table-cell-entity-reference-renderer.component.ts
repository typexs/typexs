import {get, isFunction} from 'lodash';
import {Component, Input} from '@angular/core';
import {IGridColumn} from '../api/IGridColumn';
import {IPropertyRef} from '@allgemein/schema-api';
import {C_PROPERTY, C_URL_PREFIX} from '../../constants';
import {UrlHelper} from '../../lib/UrlHelper';
import { Node } from '../../lib/datanodes/Node';
import { AbstractSimpleTableCellComponent } from './abstract-simple-table-cell.component';


@Component({
  selector: 'txs-simple-html-cell-entity-reference',
  templateUrl: 'simple-table-cell-entity-reference-renderer.component.html'
})
export class SimpleTableCellEntityReferenceRendererComponent extends AbstractSimpleTableCellComponent {

  getUrlPrefix(): string {
    return get(this.column, C_URL_PREFIX);
  }

  isEmpty() {
    return !this.getValue();
  }

  getClassRef() {
    return this.getProperty().getClassRef();
  }


  buildLookupConditions(res: any) {
    const e = this.getClassRef();
    return UrlHelper.buildLookupConditions(e, res);
  }
  //
  // getValue() {
  //   if (this.column.valueHandler) {
  //     return this.column.valueHandler(this.row.data);
  //   } else if (this.getProperty()) {
  //     return this.getProperty().get(this.row.data);
  //   } else if (this.column.field) {
  //     return get(this.row.data, this.column.field);
  //   } else {
  //     return null;
  //   }
  // }

  /**
   * Label for referenced entities
   *
   * @param x
   * @param entity
   */
  labelHandler(entity: any) {
    if (entity['label'] && isFunction(entity['label'])) {
      return entity['label']();
    }
    // const idProps = this.getProperty().getEntityRef().getPropertyRefs().filter(_x => _x.isIdentifier());
    const idProps = this.getClassRef().getPropertyRefs().filter(_x => _x.isIdentifier());
    return idProps.map(k => get(entity, k.name)).join(' ');
  }


}
