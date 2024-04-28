import { QueryEmbeddedComponent } from './query-embedded.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestQueryService } from '../../testing/TestQueryService';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { APP_BASE_HREF, DatePipe } from '@angular/common';
import { ApplicationInitStatus, Injector } from '@angular/core';
import {
  CC_GRID, CC_GRID_CELL_VALUE,
  ComponentRegistryService,
  DatatableComponent,
  EntityResolverService,
  ObjectToComponentResolver, PagerComponent,
  PagerService, SIMPLE_TABLE, SimpleHtmlCellComponent, SimpleHtmlCellValueComponent, SimpleHtmlTableComponent
} from '@typexs/base-ng';


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
        SimpleHtmlTableComponent,
        PagerComponent,
        SimpleHtmlCellComponent,
        SimpleHtmlCellValueComponent
      ],
      providers: [
        TestQueryService,
        EntityResolverService,
        { provide: APP_BASE_HREF, useValue: '/' },
        ApplicationInitStatus,
        PagerService,
        ComponentRegistryService,
        ObjectToComponentResolver,
      ]
    });
    const compRegistry = TestBed.inject(ComponentRegistryService);
    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID], SimpleHtmlTableComponent, {
      label: 'Simple table',
      datatable: true,
      default: true
    });

    compRegistry.setComponentClass([SIMPLE_TABLE, CC_GRID_CELL_VALUE], SimpleHtmlCellValueComponent);

    const service = TestBed.inject(TestQueryService);
    fixture = TestBed.createComponent(QueryEmbeddedComponent);
    component = fixture.componentInstance;
    component.service = service;
  });

  it('should have a component instance', () => {
    expect(component).not.toBeNull();
  });


});
