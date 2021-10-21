import {isEmpty, set} from 'lodash';
import {AfterViewInit, ChangeDetectorRef, Component, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {IQueryParams} from '@typexs/base-ng';
import {Like, Value} from '@allgemein/expressions';
import {DistributedStorageQueryEmbeddedComponent, DistributedStorageService, IDSOptions} from '@typexs/distributed-storage-ng';


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
  selector: 'embedded-distributed-storage',
  templateUrl: 'embedded-distributed-storage.component.html',
})
export class EmbeddedDistributedStorageComponent implements OnInit, OnChanges, AfterViewInit {

  simpleItemName = 'SimpleItem';

  simpleItemOptions: IDSOptions = {
    limit: 10,
    enablePager: true,
    freeQueryBuilder: false,
    pagerId: 'page'
  };

  simpleItemParams: IQueryParams = {};

  @ViewChild('simpleItem01', {static: true})
  simpleItemQuery: DistributedStorageQueryEmbeddedComponent;

  simpleQueryModul = new C();

  _columns: any[] = [];

  constructor(private service: DistributedStorageService,
              private changeDetector: ChangeDetectorRef) {

  }


  ngOnInit(): void {
    this.simpleItemQuery.datatable.gridReady.subscribe((x: any) => {
      this._columns = this.simpleItemQuery.datatable.api().getColumns();
    });
  }


  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }


  ngAfterViewInit() {
    this.service.isLoaded().subscribe(x => {
      this.simpleItemQuery.requery();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {

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
