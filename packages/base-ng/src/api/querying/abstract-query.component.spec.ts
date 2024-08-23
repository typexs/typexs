import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AbstractGridComponent,
  AbstractQueryComponent, ComponentRegistryService,
  DatatableComponent, EntityResolverService, IQueringService,
  ListViewComponent, ObjectToComponentResolver,
  PagerComponent, PagerService, QueryEmbeddedComponent,
  SimpleTableCellComponent, SimpleTableCellValueComponent, SimpleTableComponent
} from '@typexs/base-ng';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TestQueryService } from '@typexs/base-ng/testing/TestQueryService';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus } from '@angular/core';


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
    ]
  };
};


describe('Component: AbstractQueryComponent', () => {
  let component: QueryEmbeddedComponent;
  let demo: any;
  let fixture: ComponentFixture<any>;
  let service: IQueringService;

  beforeEach(async () => {
    const config = getTestBedConfig();
    const testBed = TestBed.configureTestingModule(config);
    fixture = testBed.createComponent(AbstractQueryComponent);
    component = fixture.componentInstance;
  });

  it('should have a component instance', () => {
    expect(component).not.toBeUndefined();
  });

  it('should have a datatable instance in component', () => {
    expect(component.datatable).not.toBeUndefined();
    expect(component.datatable).toBeInstanceOf(DatatableComponent);
  });

});
