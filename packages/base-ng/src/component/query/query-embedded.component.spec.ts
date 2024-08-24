import { QueryEmbeddedComponent } from './query-embedded.component';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TestQueryService } from '../../testing/TestQueryService';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus, Component, ViewChild } from '@angular/core';
import { DatatableComponent } from '../../datatable/datatable.component';
import { ObjectToComponentResolver } from '../../component/ObjectToComponentResolver';
import { ComponentRegistryService } from '../../component/component-registry.service';
import { PagerComponent } from '../../pager/pager.component';
import { PagerService } from '../../pager/PagerService';
import { EntityResolverService } from '../../services/entity-resolver.service';
import { SimpleTableCellValueComponent } from '../../datatable/simple-table/simple-table-cell-value.component';
import { SimpleTableCellComponent } from '../../datatable/simple-table/simple-table-cell.component';
import { CC_GRID, CC_GRID_CELL_VALUE, SIMPLE_TABLE } from '../../constants';
import { SimpleTableComponent } from '../../datatable/simple-table/simple-table.component';
import { ListViewComponent } from '../../datatable/list-view/list-view.component';
import { AbstractQueryComponent } from '../../api/querying/abstract-query.component';
import { AbstractGridComponent } from '../../datatable/api/abstract-grid.component';
import { TemplateDirective } from '../../datatable/Template.directive';
import { ViewDataComponent } from '../../component/view/view-data.component';
import { ClassType } from '@allgemein/schema-api';
import { IQueringService } from '../../api/querying/IQueringService';
import { of } from 'rxjs';
import { DefaultEntityRef } from '@allgemein/schema-api/lib/registry/DefaultEntityRef';
import { METATYPE_ENTITY } from '@allgemein/schema-api/lib/Constants';
import { XS_P_$COUNT } from '@typexs/base';
import { range } from 'lodash';
import { By } from '@angular/platform-browser';
import { JsonComponent } from '../../component/entities/json/json.component';
import { FreeQueryInputComponent } from '../../api/querying/free-query/free-query-input.component';

const getTestBedConfig = () => {
  return {
    imports: [
      BrowserTestingModule,
      RouterTestingModule
    ],
    declarations: [
      AbstractGridComponent,
      AbstractQueryComponent,
      FreeQueryInputComponent,
      ViewDataComponent,
      JsonComponent,
      TemplateDirective,
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
    ]

  };
};


describe('component: QueryEmbeddedComponent', () => {
  let component: QueryEmbeddedComponent;
  let demo: any;
  let fixture: ComponentFixture<any>;
  let service: IQueringService;


  const applyServices = () => {
    const compRegistry = TestBed.inject(ComponentRegistryService);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleTableCellValueComponent);
    service = TestBed.inject(TestQueryService);
  };

  const getFixture = async (c: ClassType<any>) => {
    const config = getTestBedConfig();
    config.declarations.push(c);
    const testBed = TestBed.configureTestingModule(config);
    await testBed.compileComponents();
    applyServices();
    fixture = TestBed.createComponent(c);
    demo = fixture.componentInstance;
    if (demo.queryElement) {
      component = demo.queryElement;
    }
  };

  describe('component checks', () => {

    beforeEach(async () => {
      const config = getTestBedConfig();
      const testBed = TestBed.configureTestingModule(config);
      fixture = TestBed.createComponent(QueryEmbeddedComponent);
      component = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      expect(component).not.toBeUndefined();
      expect(component).not.toBeNull();
    });

    it('should have a datatable instance on component', () => {
      expect(component.datatable).not.toBeUndefined();
      expect(component.datatable).not.toBeNull();
      expect(component.datatable).toBeInstanceOf(DatatableComponent);
    });


  });


  describe('use query embedded tag', () => {

    @Component({
      template: `
        <txs-query-embedded
          [componentClass]="comp"
          [options]="options"
          [entityName]="entityName"
          [service]="service"
        >
        </txs-query-embedded>
      `
    })
    class T {

      @ViewChild(QueryEmbeddedComponent, { static: true })
      queryElement: QueryEmbeddedComponent;

      entityName = 'Issue';

      comp = ListViewComponent;

      options = {};

      service = service;

    }

    beforeEach(async () => {
      await getFixture(T);
    });


    it('should have initially be loaded', () => {
      spyOn(service, 'isLoaded').and.returnValue(of(true));
      spyOn(service, 'getEntityRefForName').and.returnValue(
        new DefaultEntityRef({
          name: 'Issue',
          metaType: METATYPE_ENTITY,
          target: function() {
          }
        })
      );
      let query = null;
      let options = null;
      spyOn(service, 'query').and.callFake(
        (entityName: string, q: any, o: any) => {
          query = q;
          options = o;
          return of({ entities: [], [XS_P_$COUNT]: 0 });
        });
      fixture.detectChanges();
      expect(query).toEqual(null);
      expect(options).toEqual({ offset: 0, limit: 25 });
      expect(component.datatable.getMaxRows()).toEqual(0);
      expect(component.datatable.getViewMode()).toEqual('paged');

    });


    it('should have loaded first page of entries', fakeAsync(() => {
      spyOn(service, 'isLoaded').and.returnValue(of(true));
      spyOn(service, 'getEntityRefForName').and.returnValue(
        new DefaultEntityRef({
          name: 'Issue',
          metaType: METATYPE_ENTITY,
          target: function() {
          }
        })
      );
      let query = null;
      let options = null;
      spyOn(service, 'query').and.callFake(
        (entityName: string, q: any, o: any) => {
          query = q;
          options = o;
          const x = range(o.offset, o.offset + o.limit).map(x => ({ id: x, name: 'Hallo ' + x }));
          return of({ entities: x, [XS_P_$COUNT]: 100 });
        });
      fixture.detectChanges();
      tick(200);
      expect(query).toEqual(null);
      expect(options).toEqual({ offset: 0, limit: 25 });
      expect(component.datatable.getMaxRows()).toEqual(100);

      // fixture.detectChanges();
      const queryEl = fixture.debugElement;
      // const tableEl = tableDe.nativeElement;
      let rowElements = queryEl.queryAll(By.css('.list-container > .row'));
      expect(rowElements.length).toEqual(25);
      let contents = rowElements.map(x => JSON.parse(x.nativeNode.outerText));
      expect(contents).toHaveSize(25);
      expect(contents[0]).toEqual({id: 0, name: 'Hallo 0'});
      expect(contents[contents.length - 1]).toEqual({id: 24, name: 'Hallo 24'});
      const pageLinks = fixture.debugElement.queryAll(By.css('.pager-container:first-child a.page-link'));
      const nextPage = pageLinks.find(x => /Next/.test(x.nativeElement.textContent));
      nextPage.nativeElement.click();
      tick(200);
      fixture.detectChanges();
      tick(200);
      expect(options).toEqual({ offset: 25, limit: 25 });
      expect(component.datatable.getMaxRows()).toEqual(100);
      rowElements = queryEl.queryAll(By.css('.list-container > .row'));
      contents = rowElements.map(x => JSON.parse(x.nativeNode.outerText));
      expect(contents).toHaveSize(25);
      expect(contents[0]).toEqual({id: 25, name: 'Hallo 25'});
      expect(contents[contents.length - 1]).toEqual({id: 49, name: 'Hallo 49'});
    }));

    // TODO check re-query
    // TODO check change component
  });


});
