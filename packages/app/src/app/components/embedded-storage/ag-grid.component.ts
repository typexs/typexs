import { isEmpty, set } from '@typexs/generic';
import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Like, Value } from '@allgemein/expressions';
import { StorageQueryEmbeddedComponent, StorageService } from '@typexs/storage-ng';
import { IEntityRef } from '@allgemein/schema-api';
import { IDatatableOptions, IQueryParams } from '@typexs/base-ng';
import { AgGridWrapperComponent } from '../../addons/ag-grid/ag-grid-wrapper.component';


export class C {
  sort: string = null;
  sortDir: string = null;
  filterKey: string = null;
  filterValue: string = null;

}

/**
 * TODO:
 * - default options for grid
 *
 */
@Component({
  selector: 'embedded-storage-ag-grid',
  templateUrl: 'ag-grid.component.html'
})
export class EmbeddedStorageAgGridComponent implements OnInit {

  simpleItemName = 'TypeOrmSimpleItem';

  simpleItemOptions: IDatatableOptions = {
    limit: 10,
    enablePager: true,
    freeQueryBuilder: false,
    pagerId: 'page'
  };

  simpleItemParams: IQueryParams = {};

  @ViewChild('simpleItem01', { static: true })
  simpleItemQuery: StorageQueryEmbeddedComponent;

  simpleQueryModul = new C();

  entityRef: IEntityRef;

  gridClass = AgGridWrapperComponent;

  constructor(
    private storageService: StorageService,
    private changeDetector: ChangeDetectorRef) {
  }


  ngOnInit(): void {
    this.storageService.isLoaded().subscribe((x: any) => {
      this.entityRef = this.storageService.getEntityRefForName(this.simpleItemName);
    });
  }


  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }


  setFilterText() {
    const p = this.simpleItemParams;
    set(p, 'filters.text', Like('text', Value('Text 5*')));
    this.simpleItemParams = p;
    this.simpleItemQuery.requery();

  }

  setSortText() {
    const p = this.simpleItemParams;
    set(p, 'filters.text', Like('text', Value('Text 5*')));
    this.simpleItemParams = p;
    this.simpleItemQuery.requery();
  }


  doSubmit() {
    const p = this.simpleItemParams;
    if (!isEmpty(this.simpleQueryModul.sort)) {
      set(p, 'sorting.' + this.simpleQueryModul.sort, this.simpleQueryModul.sortDir === 'asc' ? 'asc' : 'desc');
    } else {
      set(p, 'sorting', {});
    }

    if (!isEmpty(this.simpleQueryModul.filterKey)) {
      set(p, 'filters.' + this.simpleQueryModul.filterKey, Like(this.simpleQueryModul.filterKey,
        Value(this.simpleQueryModul.filterValue ? this.simpleQueryModul.filterValue : '')));
    } else {
      set(p, 'filters', {});
    }

    this.simpleItemQuery.requery();
  }
}
