import { QueryEmbeddedComponent } from './query-embedded.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestQueryService } from '../../testing/TestQueryService';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus } from '@angular/core';
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

describe('Component: QueryEmbeddedComponent', () => {
  let component: QueryEmbeddedComponent;
  let fixture: ComponentFixture<QueryEmbeddedComponent>;

  beforeEach(() => {
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
        SimpleTableCellComponent,
        SimpleTableCellValueComponent
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

    const service = TestBed.inject(TestQueryService);
    fixture = TestBed.createComponent(QueryEmbeddedComponent);
    component = fixture.componentInstance;
    component.service = service;
  });

  it('should have a component instance', () => {
    expect(component).not.toBeNull();
  });


});
