import { clone, get, isArray, set } from 'lodash';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AbstractGridComponent,
  CC_GRID_CELL_ENTITY_OPERATIONS,
  ComponentRegistryService,
  IDatatableOptions,
  IGridColumn,
  IQueryComponentApi
} from '@typexs/base-ng';
import { IComponentBinding } from '@typexs/base';
import { ClassType } from '@allgemein/schema-api';


@Component({
  selector: 'txs-storage-query',
  templateUrl: './storage-query.component.html',
  styleUrls: ['./storage-query.component.scss']
})
export class StorageQueryComponent implements OnInit {

  options: IDatatableOptions = {};

  name: string;

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
    this.name = this.route.snapshot.paramMap.get('name');
    this.options.columnsPostProcess = this.columnsPostProcess.bind(this);
  }

  switchLayout(viewType: IComponentBinding) {
    if (viewType) {
      this.gridComponentClass = viewType.component as ClassType<AbstractGridComponent>;
    }

  }

  switchQueryOption(name: string) {
    if (name === 'raw') {
      const raw = get(this.options, 'queryOptions.raw', false);
      set(this.options, 'queryOptions.raw', !raw);
      this.options = clone(this.options);
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
