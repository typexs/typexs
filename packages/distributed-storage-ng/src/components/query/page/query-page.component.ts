import {get, isArray} from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ClassType} from '@allgemein/schema-api';
import {
  AbstractGridComponent,
  CC_GRID_CELL_ENTITY_OPERATIONS,
  ComponentRegistryService,
  IGridColumn,
  IQueryComponentApi
} from '@typexs/base-ng';
import {IComponentBinding} from '@typexs/ng';
import {ActivatedRoute} from '@angular/router';
import {IDSOptions} from '../../../lib/IDSOptions';


@Component({
  selector: 'txs-distributed-storage-query',
  templateUrl: './query-page.component.html',
  styleUrls: ['./query-page.component.scss']
})
export class DistributedStorageQueryPageComponent
  implements OnInit {

  options: IDSOptions = {
    entityTypeSelection: true
  };

  gridComponentClass: ClassType<AbstractGridComponent>;

  viewTypes: IComponentBinding[];

  constructor(
    private route: ActivatedRoute,
    private componentRegistry: ComponentRegistryService
  ) {
  }


  ngOnInit() {
    this.viewTypes = this.componentRegistry.registry.filter(x => get(x, 'extra.datatable', false));
    const defaultComponent = this.viewTypes.find(x => get(x, 'extra.default', false));
    if (defaultComponent) {
      this.gridComponentClass = defaultComponent.component as ClassType<AbstractGridComponent>;
    }
    this.options.columnsPostProcess = this.columnsPostProcess.bind(this);
  }

  switchLayout(viewType: IComponentBinding) {
    if (viewType) {
      this.gridComponentClass = viewType.component as ClassType<AbstractGridComponent>;
    }

  }

  columnsPostProcess(columns: IGridColumn[], api: IQueryComponentApi) {
    if (isArray(columns) && api) {
      columns.unshift(<IGridColumn & { urlPrefix: string }>{
        label: 'Ops',
        field: null,
        sorting: false,
        filter: false,
        entityRef: api.getEntityRef(),
        urlPrefix: api.getQueryService().getNgUrlPrefix(),
        cellValueRenderer: CC_GRID_CELL_ENTITY_OPERATIONS
      });
    }
  }

}
