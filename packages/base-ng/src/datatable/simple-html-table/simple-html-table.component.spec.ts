import { ComponentFixture, fakeAsync, TestBed, TestBedStatic, tick, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { PagerService } from './../../pager/PagerService';
import { SimpleHtmlTableComponent } from './simple-html-table.component';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IDatatableOptions, PagerComponent } from '@typexs/base-ng';
import { range } from 'lodash';
import { readWorkspace } from '@angular-devkit/core/src/workspace';
import { By } from '@angular/platform-browser';


describe('component: simple-html-table', () => {
  let component: SimpleHtmlTableComponent;
  let fixture: ComponentFixture<SimpleHtmlTableComponent>;
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
        PagerService
      ],
      declarations: [
        SimpleHtmlTableComponent,
        PagerComponent
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleHtmlTableComponent);
    component = fixture.componentInstance;

  }));


  it('should have a component instance', () => {
    expect(component).not.toBeNull();
  });

  describe('pager mode', () => {
    const limit = 10;
    const rowLimit = 100;


    beforeEach(() => {
      component.options = <IDatatableOptions>{ mode: 'paged', limit: limit, pagerId: 'page' };
      // add 100 rows
      component.rows = range(0, rowLimit).map(x => ({ id: x, name: 'Row ' + x }));
    });

    it('paging should be correctly initialized', () => {
      fixture.detectChanges();
      expect(component.pager.currentPage).toEqual(1);
      expect(component.pager.minPage).toEqual(1);
      expect(component.pager.totalPages).toEqual(rowLimit / limit);
      const dataNodes = component.getDataNodes();

      expect(dataNodes.limit).toEqual(limit);
      expect(dataNodes.startIdx).toEqual(0);
      expect(dataNodes.endIdx).toEqual(limit);
      expect(dataNodes.maxRows).toEqual(rowLimit);
      expect(dataNodes).toHaveSize(rowLimit);

      const tableDe = fixture.debugElement;
      const tableEl = tableDe.nativeElement;
      const rowElements = tableEl.querySelectorAll('tbody > tr');
      expect(rowElements.length).toEqual(limit);
      for (const [k, v] of rowElements.entries()) {
        const tds = v.querySelectorAll('td');
        expect(tds.length).toEqual(2);
        const idNode = tds.item(0).childNodes.item(0);
        expect(idNode.row).toEqual({ id: k, name: 'Row ' + k });
        // TODO can't check html output in tr line
      }
    });


    it('switch to next page should work', fakeAsync(() => {
      fixture.detectChanges();
      const pageLinks = fixture.debugElement.queryAll(By.css('.pager-container:first-child a.page-link'));
      const nextPage = pageLinks.find(x => /Next/.test(x.nativeElement.textContent));

      // const method = spyOn(fixture.componentInstance, 'onPagerAction');
      nextPage.nativeElement.click();


      // console.log('');
      tick(100);

      // fixture.whenStable().then(() => {
      expect(component.pager.currentPage).toEqual(2);
      expect(component.pager.minPage).toEqual(1);
      expect(component.pager.totalPages).toEqual(rowLimit / limit);
      const dataNodes = component.getDataNodes();
      expect(dataNodes.limit).toEqual(limit);
      expect(dataNodes.startIdx).toEqual(limit);
      expect(dataNodes.endIdx).toEqual(limit * 2);
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
        expect(idNode.nativeNode.row).toEqual({ id: _k, name: 'Row ' + _k });
        // TODO can't check html output in tr line
      }

    }));

  });


  describe('infinite mode', () => {
    const limit = 10;
    const rowLimit = 100;


    beforeEach(() => {
      component.options = <IDatatableOptions>{ mode: 'infinite', limit: limit };
      // add 100 rows
      component.rows = range(0, rowLimit).map(x => ({ id: x, name: 'Row ' + x }));
    });

    it('TODO infinite initialized', () => {

    });
  });

});

