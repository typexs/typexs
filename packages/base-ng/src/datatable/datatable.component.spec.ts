// TODO move to datatable tests
import { ApplicationInitStatus, Component, ViewChild } from '@angular/core';
import {
  AbstractGridComponent,
  AbstractQueryComponent, CodeComponent, ComponentRegistryService,
  DatatableComponent, EntityResolverService, IDatatableListGridOptions, IQueringService, JsonComponent,
  ListViewComponent, ObjectToComponentResolver,
  PagerComponent, PagerService, QueryEmbeddedComponent,
  SimpleTableCellComponent, SimpleTableCellValueComponent, SimpleTableComponent, TemplateDirective, ViewDataComponent
} from '@typexs/base-ng';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestQueryService } from '@typexs/base-ng/testing/TestQueryService';
import { APP_BASE_HREF } from '@angular/common';
import { range } from 'lodash';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { XS_P_$OFFSET, XS_P_$LIMIT, XS_P_$COUNT } from './Constants';


function genData(start: number, end: number) {
  return range(start, end + 1).map(x => ({ id: x, name: 'Row ' + x }));
}

const getTestBedConfig = () => {
  return {
    imports: [
      BrowserTestingModule,
      RouterTestingModule
    ],
    declarations: [
      AbstractGridComponent,
      AbstractQueryComponent,
      ViewDataComponent,
      JsonComponent,
      CodeComponent,
      PagerComponent,
      DatatableComponent,
      ListViewComponent,
      SimpleTableCellComponent,
      SimpleTableCellValueComponent,
      SimpleTableComponent,
      TemplateDirective,
      QueryEmbeddedComponent
    ],
    providers: [
      TestQueryService,
      EntityResolverService,
      { provide: APP_BASE_HREF, useValue: '/' },
      ApplicationInitStatus,
      PagerService,
      ComponentRegistryService,
      ObjectToComponentResolver
      // ComponentFactoryResolver,
      // ChangeDetectorRef,
      // Injector
    ]
  };
};


describe('component: DatatableComponent', () => {

  let component: DatatableComponent;
  let demo: any;
  let fixture: ComponentFixture<any>;
  let service: IQueringService;

  @Component({
    selector: 'txs-dummy',
    template: `
      <txs-datatable [component]="comp">
      </txs-datatable>
    `
  })
  class AX {

    @ViewChild(DatatableComponent, { static: true })
    child: DatatableComponent;

    comp = ListViewComponent;
  }

  describe('datatable direct', () => {
    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(AX as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(AX);
      demo = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      fixture.detectChanges();
      expect(demo).not.toBeUndefined();
      expect(demo).not.toBeNull();
      expect(demo.child).not.toBeNull();
      expect(demo.child).not.toBeUndefined();
      expect(demo.child).toBeInstanceOf(DatatableComponent as any);

    });

  });

  describe('datatable embedded', () => {
    @Component({
      selector: 'txs-over-dummy',
      template: `
        <txs-dummy>
        </txs-dummy>
      `
    })
    class Y {
      @ViewChild(AX, { static: true })
      child: AX;
    }

    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(AX as any, Y as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(Y);
      demo = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      fixture.detectChanges();
      expect(demo).not.toBeUndefined();
      expect(demo).not.toBeNull();
      expect(demo.child).not.toBeNull();
      expect(demo.child).not.toBeUndefined();
      expect(demo.child.child).not.toBeNull();
      expect(demo.child.child).not.toBeUndefined();
      expect(demo.child.child).toBeInstanceOf(DatatableComponent as any);
    });

  });


  describe('datatable inherited', () => {
    @Component({
      selector: 'txs-dummy-inherited',
      template: `
        <txs-datatable [component]="comp">
        </txs-datatable>
      `
    })
    class XI extends AX {
    }


    @Component({
      selector: 'txs-over-dummy-inherited',
      template: `
        <txs-dummy-inherited>
        </txs-dummy-inherited>
      `
    })
    class YI {
      @ViewChild(XI, { static: true })
      child: XI;
    }

    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(AX as any, XI as any, YI as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(YI);
      demo = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      fixture.detectChanges();
      expect(demo).not.toBeUndefined();
      expect(demo).not.toBeNull();
      expect(demo.child).not.toBeNull();
      expect(demo.child).not.toBeUndefined();
      expect(demo.child.child).not.toBeNull();
      expect(demo.child.child).not.toBeUndefined();
      expect(demo.child.child).toBeInstanceOf(DatatableComponent as any);


    });

  });

  describe('set nodes manually', () => {
    @Component({
      template: `
        <txs-datatable [component]="comp" [options]="options">
        </txs-datatable>
      `
    })
    class XN {

      @ViewChild(DatatableComponent, { static: true })
      child: DatatableComponent;

      comp = ListViewComponent;

      options = <IDatatableListGridOptions>{
        queryAutoLoad: false
      };
    }

    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(XN as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(XN);
      demo = fixture.componentInstance;
      component = demo.child;
    });

    it('add all nodes', fakeAsync(() => {
      fixture.detectChanges();
      component.setRows(genData(0, 24));
      component.rebuild({ data: { rows: true } });
      expect(component.getNodes().getLoadBoundries())
        .toEqual({ start: 0, end: 24, range: 25 });
      // tick(100);
      expect(component.getMaxRows()).toEqual(25);
      fixture.detectChanges();
      const tableDe = fixture.debugElement;
      const rowElements = tableDe.queryAll(
        By.css('.list-container .row')
      );
      expect(rowElements.length).toEqual(25);
    }));

    it('add nodes with max entries', fakeAsync(() => {
      fixture.detectChanges();
      const data = genData(0, 24);
      data[XS_P_$COUNT] = 100;
      data[XS_P_$LIMIT] = 10;
      data[XS_P_$OFFSET] = 0;

      component.setRows(data);
      component.rebuild({ data: { rows: true } });
      expect(component.getNodes().getFrameBoundries()).toEqual({ start: 0, end: 9, range: 10 });
      expect(component.getNodes().getLoadBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(component.getMaxRows()).toEqual(100);
      fixture.detectChanges();
      const tableDe = fixture.debugElement;
      const rowElements = tableDe.queryAll(By.css('.list-container .row'));
      expect(rowElements.length).toEqual(10);
    }));

  });

  describe('use query callback for entry loading', () => {
    @Component({
      template: `
        <txs-datatable [component]="comp" [options]="options">
        </txs-datatable>
      `
    })
    class XM {

      @ViewChild(DatatableComponent, { static: true })
      child: DatatableComponent;

      comp = ListViewComponent;

      options = <IDatatableListGridOptions>{
        queryCallback:
          (start: number, end: number, limit1?: number) => {
            return of(genData(start, end));
          }
      };
    }

    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(XM as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(XM);
      demo = fixture.componentInstance;
      component = demo.child;
    });

    it('should auto load records on startup', fakeAsync(() => {
      fixture.detectChanges();
      expect(component.getNodes().getLoadBoundries())
        .toEqual({ start: 0, end: 24, range: 25 });
      const tableDe = fixture.debugElement;
      const rowElements = tableDe.queryAll(By.css('.list-container .row'));
      expect(rowElements.length).toEqual(25);
    }));

  });

});

