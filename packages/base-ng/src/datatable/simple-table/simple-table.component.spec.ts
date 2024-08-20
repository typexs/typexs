import { ComponentFixture, fakeAsync, TestBed, TestBedStatic, tick, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { PagerService } from './../../pager/PagerService';
import { SimpleTableComponent } from './simple-table.component';
import { APP_BASE_HREF, DatePipe } from '@angular/common';
import { ApplicationInitStatus, Injector, NO_ERRORS_SCHEMA } from '@angular/core';
import { assign, range } from 'lodash';
import { By } from '@angular/platform-browser';
import { K_PAGED } from '../api/IGridMode';
import { ObjectToComponentResolver } from '../../component/ObjectToComponentResolver';
import { ComponentRegistryService } from '../../component/component-registry.service';
import { PagerComponent } from '../../pager/pager.component';
import { IDatatableOptions } from '../../datatable/api/IDatatableOptions';
import { SimpleTableCellValueComponent } from '../../datatable/simple-table/simple-table-cell-value.component';
import { SimpleTableCellComponent } from '../../datatable/simple-table/simple-table-cell.component';
import { CC_GRID, CC_GRID_CELL_VALUE, SIMPLE_TABLE } from '../../constants';

describe('component: simple-table', () => {
  let component: SimpleTableComponent;
  let fixture: ComponentFixture<SimpleTableComponent>;
  let testBedStatic: TestBedStatic;

  beforeEach(waitForAsync(() => {


    TestBed.configureTestingModule({
      imports: [
        BrowserTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
        ApplicationInitStatus,
        // Router,
        // ActivatedRoute,
        // { provide: Location, useValue: SpyLocation },
        // { provide: PagerService, useValue: PagerService }
        PagerService,
        DatePipe,
        ComponentRegistryService,
        ObjectToComponentResolver,
        // ComponentFactoryResolver,
        Injector
      ],
      declarations: [
        SimpleTableComponent,
        PagerComponent,
        SimpleTableCellComponent,
        SimpleTableCellValueComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    const compRegistry = TestBed.inject(ComponentRegistryService);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });

    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleTableCellValueComponent);
    // compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_REFERENCE], SimpleTableCellEntityReferenceRendererComponent);
    // compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_OBJECT_REFERENCE], SimpleTableCellObjectReferenceRendererComponent);
    // compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ENTITY_OPERATIONS], SimpleTableCellEntityOperationsRendererComponent);
    // compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_ROUTER_LINK], SimpleTableCellRouterLinkRendererComponent);

    fixture = TestBed.createComponent(SimpleTableComponent);
    component = fixture.componentInstance;
  }));


  it('should have a component instance', () => {
    expect(component).not.toBeNull();
  });

  describe('pager mode', () => {
    const limit = 10;
    const rowLimit = 100;


    beforeEach(() => {
      component.options = <IDatatableOptions>{ mode: K_PAGED, limit: limit, pagerId: 'page' };
      // add 100 rows
      component.rows = range(0, rowLimit).map(x => ({ id: x, name: 'Row ' + x }));
    });

    it('paging should be correctly initialized', () => {
      fixture.detectChanges();
      const pager = component.getPager();
      expect(pager.currentPage).toEqual(1);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(rowLimit / limit);
      const dataNodes = component.getDataNodes();

      expect(dataNodes.limit).toEqual(limit);
      expect(dataNodes.getFrameBoundries()).toEqual({ start: 0, end: limit - 1, range: limit });
      expect(dataNodes.maxRows).toEqual(rowLimit);
      expect(dataNodes).toHaveSize(rowLimit);

      const tableDe = fixture.debugElement;
      // const tableEl = tableDe.nativeElement;
      const rowElements = tableDe.queryAll(By.css('tbody > tr'));
      expect(rowElements.length).toEqual(limit);
      for (const [k, v] of rowElements.entries()) {
        const tds = v.queryAll(By.css('td'));
        expect(tds.length).toEqual(2);
        expect(tds.length).toEqual(2);
        const idNode = tds[0].childNodes[0];
        expect(idNode.componentInstance.row.data).toEqual({ id: k, name: 'Row ' + k });
      }
    });


    /**
     * Move to next page by clicking on on pager link
     */
    it('switch to next page should work', fakeAsync(() => {
      fixture.detectChanges();
      const pageLinks = fixture.debugElement.queryAll(By.css('.pager-container:first-child a.page-link'));
      const nextPage = pageLinks.find(x => /Next/.test(x.nativeElement.textContent));

      // const method = spyOn(fixture.componentInstance, 'onPagerAction');
      nextPage.nativeElement.click();

      tick(100);

      // fixture.whenStable().then(() => {
      const pager = component.getPager();
      expect(pager.currentPage).toEqual(2);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(rowLimit / limit);
      const dataNodes = component.getDataNodes();
      expect(dataNodes.limit).toEqual(limit);
      expect(dataNodes.maxRows).toEqual(rowLimit);
      expect(dataNodes).toHaveSize(rowLimit);
      fixture.detectChanges();

      const tableDe = fixture.debugElement;
      const rowElements = tableDe.queryAll(By.css('tbody > tr'));
      expect(rowElements.length).toEqual(limit);
      for (const [k, v] of rowElements.entries()) {
        const _k = k + limit;
        const tds = v.queryAll(By.css('td'));
        expect(tds.length).toEqual(2);
        const idNode = tds[0].childNodes[0];
        expect(idNode.componentInstance.row.data).toEqual({ id: _k, name: 'Row ' + _k });
      }
    }));

    /**
     * Check if pager adapts on rows change
     */
    it('pager changes on rows change', fakeAsync(() => {
      fixture.detectChanges();
      const pager = component.getPager();
      expect(pager.currentPage).toEqual(1);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(10);
      let data = component.getDataNodes().getLoadBoundries();
      expect(data).toEqual({ start: 0, end: 99, range: 25 });
      component.rows = range(0, 25).map(x => ({ id: x, name: 'Row ' + x }));
      fixture.detectChanges();

      expect(pager.currentPage).toEqual(1);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(3);
      data = component.getDataNodes().getLoadBoundries();
      expect(data).toEqual({ start: 0, end: 24, range: 25 });
    }));

    /**
     * Check if pager adapts on limit change
     */
    it('pager changes on limit change', fakeAsync(() => {
      fixture.detectChanges();
      const pager = component.getPager();
      expect(pager.currentPage).toEqual(1);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(10);
      let data = component.getDataNodes().getLoadBoundries();
      expect(data).toEqual({ start: 0, end: 99, range: 25 });
      component.options = assign(component.options, { limit: 25 });
      component.rebuild();

      fixture.detectChanges();
      expect(pager.currentPage).toEqual(1);
      expect(pager.minPage).toEqual(1);
      expect(pager.totalPages).toEqual(4);
      data = component.getDataNodes().getLoadBoundries();
      expect(data).toEqual({ start: 0, end: 99, range: 25 });
    }));


    // /**
    //  * Check if pager adapts on limit change
    //  */
    // it('pager changes on limit change', fakeAsync(() => {
    // }));

    /**
     * TODO:
     * - reset data nodes for a reload
     * - last page load with lesser records then given limit -> fix end frame value
     * - set cache size
     */

  });


  // describe('infinite mode', () => {
  //   const limit = 10;
  //   const rowLimit = 100;
  //
  //
  //   describe('over query callback', () => {
  //
  //     beforeEach(() => {
  //       component.options = <IDatatableOptions>{ mode: 'infinite', limit: limit };
  //       component.maxRows = rowLimit;
  //       component.registerQueryCallback(
  //         (start: number, end: number, limit1?: number) => {
  //           const arr = range(start, end + 1).map(x => ({ id: x, name: 'Row ' + x }));
  //           return of(arr);
  //         });
  //       // add 100 rows
  //       // component.rows = range(0, rowLimit).map(x => ({ id: x, name: 'Row ' + x }));
  //     });
  //
  //     /**
  //      * Check if loaded elements fill scroll region
  //      */
  //     it('check if loaded elements fill scroll region', fakeAsync(() => {
  //       fixture.detectChanges();
  //
  //       expect(component.getDataNodes().getFrameBoundries()).toEqual({ start: 0, end: 9, range: 10 });
  //       const elements = component.getElementsInScrollView();
  //       expect(elements.possibleAdditional).toEqual(9);
  //
  //       // Load missing rows
  //       const startIdx = elements.endIdx + 1;
  //       const endIdx = startIdx + elements.possibleAdditional;
  //
  //       component.getDataNodes().doChangeSpan(elements.startIdx, endIdx).subscribe(x => {
  //       });
  //
  //       tick(50);
  //       fixture.detectChanges();
  //       tick(50);
  //       expect(component.getDataNodes().getFrameBoundries()).toEqual({ start: 0, end: endIdx, range: 10 });
  //       // tick(100);
  //       const elements2 = component.getElementsInScrollView();
  //       expect(elements2.possibleAdditional).toEqual(0);
  //     }));
  //
  //
  //     /**
  //      * Load initial nodes - filling height of tbody
  //      */
  //     it('infinite should be correctly initialized', () => {
  //       fixture.detectChanges();
  //       expect(component.pager).toBeUndefined();
  //       // expect(component).toBeUndefined();
  //       const dataNodes = component.getDataNodes();
  //
  //       expect(component['unlistenMouseEnter']).not.toBeUndefined();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       // expect(dataNodes).toHaveSize(rowLimit);
  //
  //       const tableDe = fixture.debugElement;
  //       const tableBody = tableDe.query(By.css('tbody'));
  //       const rowElements = tableBody.queryAll(By.css('tr'));
  //       expect(rowElements.length).toEqual(rowLimit);
  //       for (const [k, v] of rowElements.entries()) {
  //         if (v.nativeElement.classList.contains('placeholder')) {
  //           continue;
  //         }
  //         const tds = v.queryAll(By.css('td'));
  //         expect(tds.length).toEqual(2);
  //         const idNode = tds[0].childNodes[0];
  //         expect(idNode.componentInstance.row.data).toEqual({ id: k, name: 'Row ' + k });
  //       }
  //     });
  //
  //
  //     /**
  //      * Scroll down within the frame
  //      */
  //     it('simulate scroll down - within the frame', fakeAsync(() => {
  //       fixture.detectChanges();
  //       const dataNodes = component.getDataNodes();
  //       const tableDe = fixture.debugElement;
  //       const tableBodyDe = tableDe.query(By.css('tbody'));
  //       // mouse entering table body enables scroll listener
  //       tableDe.triggerEventHandler('mouseenter', {});
  //       tick(100);
  //       fixture.detectChanges();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       expect(dataNodes.getFrameBoundries()).toEqual({ start: 0, end: 9, range: 10 });
  //
  //       // Fälle:
  //       // 1. höhe der geladenen Datensätz <= tbody.scrollHeight -> weitere nachladen, da sichtbereich nicht ausgefüllt
  //       // 2. höhe der geladenen Datensätz > tbody.scrollHeight -> tue nix
  //       // 3. ---
  //
  //       const tbodyElem = component.getScrollElement();
  //       scrollTo(tbodyElem, { top: 200, left: 0 });
  //       const scroll = new Event('scroll');
  //       tableBodyDe.nativeElement.dispatchEvent(scroll); // nativeElement.h1.nativeElement.dispatchEvent(mouseenter);
  //       tick(100);
  //       fixture.detectChanges();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       expect(dataNodes.getFrameBoundries()).toEqual({ start: 7, end: 26, range: 10 });
  //
  //
  //       const tableBody = tableDe.query(By.css('tbody'));
  //       const rowElements = tableBody.queryAll(By.css('tr'));
  //       expect(rowElements.length).toEqual(rowLimit);
  //       const data = [];
  //       for (const [k, v] of rowElements.entries()) {
  //         if (v.nativeElement.classList.contains('placeholder')) {
  //           continue;
  //         }
  //         const tds = v.queryAll(By.css('td'));
  //         expect(tds.length).toEqual(2);
  //         const idNode = tds[0].childNodes[0];
  //         data.push(idNode.componentInstance.row.data);
  //         // expect(idNode.componentInstance.row.data).toEqual({ id: k, name: 'Row ' + k });
  //       }
  //       expect(last(data)).toEqual({ id: 26, name: 'Row 26' });
  //       expect(data).toHaveSize(27);
  //       tableDe.triggerEventHandler('mouseleave', {});
  //     }));
  //
  //
  //     /**
  //      * Scroll down outside the frame
  //      */
  //     it('simulate scroll down - outside the frame', fakeAsync(() => {
  //       fixture.detectChanges();
  //       const dataNodes = component.getDataNodes();
  //       const tableDe = fixture.debugElement;
  //       const tableBodyDe = tableDe.query(By.css('tbody'));
  //       // mouse entering table body enables scroll listener
  //       tableDe.triggerEventHandler('mouseenter', {});
  //       tick(100);
  //       fixture.detectChanges();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       expect(dataNodes.getFrameBoundries()).toEqual({ start: 0, end: 9, range: 10 });
  //
  //       // Fälle:
  //       // 1. höhe der geladenen Datensätz <= tbody.scrollHeight -> weitere nachladen, da sichtbereich nicht ausgefüllt
  //       // 2. höhe der geladenen Datensätz > tbody.scrollHeight -> tue nix
  //       // 3. ---
  //
  //       const tbodyElem = component.getScrollElement();
  //       scrollTo(tbodyElem, { top: 600, left: 0 });
  //       const scroll = new Event('scroll');
  //       tableBodyDe.nativeElement.dispatchEvent(scroll); // nativeElement.h1.nativeElement.dispatchEvent(mouseenter);
  //       tick(100);
  //       fixture.detectChanges();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       expect(dataNodes.getFrameBoundries()).toEqual({ start: 25, end: 44, range: 10 });
  //
  //
  //       const tableBody = tableDe.query(By.css('tbody'));
  //       const rowElements = tableBody.queryAll(By.css('tr'));
  //       expect(rowElements.length).toEqual(rowLimit);
  //       const data = [];
  //       for (const [k, v] of rowElements.entries()) {
  //         if (v.nativeElement.classList.contains('placeholder')) {
  //           continue;
  //         }
  //         const tds = v.queryAll(By.css('td'));
  //         expect(tds.length).toEqual(2);
  //         const idNode = tds[0].childNodes[0];
  //         data.push(idNode.componentInstance.row.data);
  //         // expect(idNode.componentInstance.row.data).toEqual({ id: k, name: 'Row ' + k });
  //       }
  //       expect(last(data)).toEqual({ id: 44, name: 'Row 44' });
  //       expect(data).toHaveSize(30);
  //       tableDe.triggerEventHandler('mouseleave', {});
  //     }));
  //
  //
  //     /**
  //      * Scroll till the end
  //      */
  //     it('simulate scroll down - till the end', fakeAsync(() => {
  //       fixture.detectChanges();
  //       const dataNodes = component.getDataNodes();
  //       const tableDe = fixture.debugElement;
  //       const tableBodyDe = tableDe.query(By.css('tbody'));
  //       // mouse entering table body enables scroll listener
  //       tableDe.triggerEventHandler('mouseenter', {});
  //       tick(100);
  //       fixture.detectChanges();
  //
  //       expect(dataNodes.limit).toEqual(limit);
  //       expect(dataNodes.maxRows).toEqual(rowLimit);
  //       expect(dataNodes.getFrameBoundries()).toEqual({ start: 0, end: 9, range: 10 });
  //
  //       // Fälle:
  //       // 1. höhe der geladenen Datensätz <= tbody.scrollHeight -> weitere nachladen, da sichtbereich nicht ausgefüllt
  //       // 2. höhe der geladenen Datensätz > tbody.scrollHeight -> tue nix
  //       // 3. ---
  //
  //       const tbodyElem = component.getScrollElement();
  //       const tableBody = tableDe.query(By.css('tbody'));
  //
  //       let end = false;
  //       let inc = 1;
  //       let data = [];
  //       while (!end) {
  //         data = [];
  //         scrollTo(tbodyElem, { top: inc * 200, left: 0 });
  //         inc++;
  //         const scroll = new Event('scroll');
  //         tableBodyDe.nativeElement.dispatchEvent(scroll); // nativeElement.h1.nativeElement.dispatchEvent(mouseenter);
  //         tick(100);
  //         fixture.detectChanges();
  //
  //         const rowElements = tableBody.queryAll(By.css('tr'));
  //         for (const [k, v] of rowElements.entries()) {
  //           if (v.nativeElement.classList.contains('placeholder')) {
  //             continue;
  //           }
  //           const tds = v.queryAll(By.css('td'));
  //           const idNode = tds[0].childNodes[0];
  //           data.push(idNode.componentInstance.row.data);
  //         }
  //         end = data.length === rowElements.length;
  //         // const frameBound = component.getDataNodes().getFrameBoundries();
  //       }
  //       expect(data).toHaveSize(100);
  //     }));
  //
  //     /**
  //      * Todo
  //      *
  //      * - load more the 1000 prefill
  //      * - remove records if higher then 1000
  //      * - columns sprengen den rahmen - vertical scroll?
  //      */
  //   });
  // });
});

