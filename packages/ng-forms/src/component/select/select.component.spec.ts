/* eslint no-use-before-define: 0 */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent } from './select.component';
import { ComponentFactoryResolver, Injector, NgModule } from '@angular/core';
import { Entity, Property } from '@allgemein/schema-api';
import { K_STORABLE } from '@typexs/entity';
import { Select } from '@typexs/ng';
import { FormService } from '@typexs/ng-forms/form.service';
import { ComponentRegistryService, EntityResolverService, ObjectToComponentResolver } from '@typexs/base-ng';
import { FormComponent } from '@typexs/ng-forms/form.component';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

@Entity({ [K_STORABLE]: false })
export class ObjectWithSelection {

  /**
   * List of options passed by array
   */
  @Select({ label: 'Favored color', enum: ['Blue', 'Green', 'Red'] })
  @Property()
  favoredColor: string;

}

@NgModule({
  imports: [
    CommonModule,
    FormsModule
  ],
  declarations: [
    FormComponent,
    SelectComponent
  ],
  exports:[
    FormComponent,
    SelectComponent
  ],
  entryComponents: [
    FormComponent,
    SelectComponent
  ]
})
export class SelectTestModule {

}

describe('FormBuilder - SelectComponent', () => {
  let component: SelectComponent;
  let formComponent: FormComponent;
  let fixture: ComponentFixture<SelectComponent>;
  let formFixture: ComponentFixture<FormComponent>;
  let select: HTMLElement;

  beforeEach((() => {

    TestBed.configureTestingModule({
      imports: [
        // BrowserDynamicTestingModule
        // FormsModule
        SelectTestModule
      ],
      providers: [
        // Injector,
        // ComponentFactoryResolver,
        ObjectToComponentResolver,
        FormService,
        EntityResolverService,
        ComponentRegistryService
      ],
      declarations: [
        SelectComponent,
        FormComponent
      ],

    });
    // TestBed.overrideModule(BrowserDynamicTestingModule, {
    //   set: {
    //     entryComponents: [SelectComponent]
    //   }
    // });
    // fixture = TestBed.createComponent(SelectComponent);
    // component = fixture.componentInstance;
    // select = fixture.nativeElement.querySelector('select-wrapper');
  }));

  it('should create form with simple select form element', (() => {
    const selectObject = new ObjectWithSelection();
    // const formService = TestBed.inject(FormService);
    formFixture = TestBed.createComponent(FormComponent);
    formFixture.componentInstance.instance = selectObject;
    formFixture.detectChanges();


    const selections = formFixture.debugElement.queryAll(By.css('.select-wrapper'));
    expect(selections).toHaveSize(1);
    const options = selections[0].queryAll(By.css('option'));
    expect(options).toHaveSize(3);
  }));

  // it(`should have as title 'app'`, async(() => {
  //   const fixture = TestBed.createComponent(SelectComponent);
  //   const app = fixture.debugElement.componentInstance;
  //   //expect(app.title).toEqual('app');
  // }));
  //
  // it('should render title in a h1 tag', async(() => {
  //   const fixture = TestBed.createComponent(SelectComponent);
  //   fixture.detectChanges();
  //   const compiled = fixture.debugElement.nativeElement;
  //   //expect(compiled.querySelector('h1').textContent).toContain('Welcome to app!');
  // }));
});
