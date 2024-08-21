import { QueryEmbeddedComponent } from './query-embedded.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestQueryService } from '../../testing/TestQueryService';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus, Component } from '@angular/core';
import { DatatableComponent } from '../../datatable/datatable.component';
import { ObjectToComponentResolver } from '../../component/ObjectToComponentResolver';
import { ComponentRegistryService } from '../../component/component-registry.service';
import { PagerComponent } from '../../pager/pager.component';
import { PagerService } from '../../pager/PagerService';
import { EntityResolverService } from '../../services/entity-resolver.service';
import { SimpleTableCellValueComponent } from '../../datatable/simple-table/simple-table-cell-value.component';
import { SimpleTableCellComponent } from '../../datatable/simple-table/simple-table-cell.component';
import { CC_GRID, CC_GRID_CELL_VALUE, LIST_VIEW, SIMPLE_TABLE } from '../../constants';
import { SimpleTableComponent } from '../../datatable/simple-table/simple-table.component';
import { ListViewComponent } from '@typexs/base-ng';
import { ClassType } from '@allgemein/schema-api';
import { IQueringService } from '../../api/querying/IQueringService';
import { of } from 'rxjs';
import { EntityRef } from '@typexs/entity/libs/registry/EntityRef';
import { DefaultEntityRef } from '@allgemein/schema-api/lib/registry/DefaultEntityRef';
import { METATYPE_ENTITY } from '@allgemein/schema-api/lib/Constants';

describe('Component: QueryEmbeddedComponent', () => {
  let component: QueryEmbeddedComponent;
  let fixture: ComponentFixture<QueryEmbeddedComponent>;
  let service: IQueringService;

  const getFixture = (c: ClassType<any>) => {
    TestBed.configureTestingModule({
      imports: [
        BrowserTestingModule,
        RouterTestingModule
      ],
      declarations: [
        QueryEmbeddedComponent,
        DatatableComponent,
        SimpleTableComponent,
        PagerComponent,
        ListViewComponent,
        SimpleTableCellComponent,
        SimpleTableCellValueComponent,
        c
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
    });
    const compRegistry = TestBed.inject(ComponentRegistryService);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });

    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleTableCellValueComponent);

    service = TestBed.inject(TestQueryService);
    fixture = TestBed.createComponent(c);
    component = fixture.componentInstance;
    // component.service = service;
  }


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

      entityName = 'Issue';

      comp = ListViewComponent;

      options = {};

      service = service;

    }

    beforeEach(() => {
      getFixture(T);
    });

    it('should have a component instance', () => {
      expect(component).not.toBeNull();
    });

    it('should match datatable', () => {
      spyOn(service, 'isLoaded').and.returnValue(of(true));
      spyOn(service, 'getEntityRefForName').and.returnValue(
        new DefaultEntityRef({
          name: 'Issue',
          metaType: METATYPE_ENTITY,
          target: function(){}
        })
      );

      fixture.detectChanges();
      expect(component.datatable).not.toBeNull();
    });

  })



});
