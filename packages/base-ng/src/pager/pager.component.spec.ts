import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus, Component, ViewChild } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { PagerComponent } from './pager.component';
import { PagerService } from './PagerService';
import { PagerAction } from './PagerAction';


describe('component: PagerComponent', () => {


  describe('', () => {
    let component: PagerComponent;
    let fixture: ComponentFixture<PagerComponent>;


    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          BrowserTestingModule,
          RouterTestingModule
        ],
        providers: [
          { provide: APP_BASE_HREF, useValue: '/' },
          ApplicationInitStatus,
          // ActivatedRoute,
          // Router,
          PagerService
        ],
        declarations: [
          PagerComponent
        ]
      }).compileComponents();
      fixture = TestBed.createComponent(PagerComponent);
      component = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      expect(component).not.toBeNull();
    });
  });


  describe('test', () => {
    @Component({
      // standalone: true,
      // imports: [PagerComponent],
      template: `
        <txs-pager
          (pageChange)="onSelected($event)">
        </txs-pager>
      `
    })
    class TestHostComponent {

      @ViewChild(PagerComponent)
      pagerComp: PagerComponent;

      action: PagerAction;

      onSelected(hero: PagerAction) {
        this.action = hero;
      }
    }

    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          BrowserTestingModule,
          RouterTestingModule
        ],
        providers: [
          { provide: APP_BASE_HREF, useValue: '/' },
          ApplicationInitStatus,
          PagerService
        ],
        declarations: [
          TestHostComponent, PagerComponent
        ]
      }).compileComponents();
      fixture = TestBed.createComponent(TestHostComponent);
      component = fixture.componentInstance;
    });

    it('should have a component instance', () => {
      expect(component).not.toBeNull();
    });

    it('register callback over @Output', fakeAsync(() => {
      fixture.detectChanges();
      // const callback = component.onSelected;
      const pagerComp = component.pagerComp;
      const pageChange = pagerComp.pageChange;
      // const eventEmitter = pagerComp.pager.emitter;
      const action = new PagerAction(1, 'pager', 'set');
      pageChange.emit(action);
      expect(component.action).toEqual(action);
    }));

  });


});
