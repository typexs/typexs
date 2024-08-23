// TODO move to datatable tests
import { ApplicationInitStatus, Component, ViewChild } from '@angular/core';
import {
  AbstractGridComponent,
  AbstractQueryComponent, ComponentRegistryService,
  DatatableComponent, EntityResolverService, IQueringService,
  ListViewComponent, ObjectToComponentResolver,
  PagerComponent, PagerService, QueryEmbeddedComponent,
  SimpleTableCellComponent, SimpleTableCellValueComponent, SimpleTableComponent
} from '@typexs/base-ng';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestQueryService } from '@typexs/base-ng/testing/TestQueryService';
import { APP_BASE_HREF } from '@angular/common';

const getTestBedConfig = () => {
  return {
    imports: [
      BrowserTestingModule,
      RouterTestingModule
    ],
    declarations: [
      AbstractGridComponent,
      AbstractQueryComponent,
      PagerComponent,
      DatatableComponent,
      ListViewComponent,
      SimpleTableCellComponent,
      SimpleTableCellValueComponent,
      SimpleTableComponent,
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


describe('datatable', () => {

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
  class X {

    @ViewChild(DatatableComponent, { static: true })
    child: DatatableComponent;

    comp = ListViewComponent;
  }

  describe('datatable direct', () => {
    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(X as any);
      const testBed = TestBed.configureTestingModule(config);
      fixture = testBed.createComponent(X);
      demo = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      fixture.detectChanges();
      expect(demo).not.toBeUndefined();
      expect(demo).not.toBeNull();
      expect(demo.child).not.toBeNull();
      expect(demo.child).not.toBeUndefined();
      expect(demo.child).toBeInstanceOf(DatatableComponent);

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
      @ViewChild(X, { static: true })
      child: X;
    }

    beforeEach(async () => {
      const config = getTestBedConfig();
      config.declarations.push(X as any, Y as any);
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
      expect(demo.child.child).toBeInstanceOf(DatatableComponent);
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
    class XI extends X {
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
      config.declarations.push(X as any, XI as any, YI as any);
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
      expect(demo.child.child).toBeInstanceOf(DatatableComponent);


    });

  });

});

