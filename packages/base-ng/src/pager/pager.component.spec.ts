import { ComponentFixture, TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { ApplicationInitStatus } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { PagerComponent } from './pager.component';
import { PagerService } from './PagerService';


describe('component: pager', () => {

  // describe('menu without base path', () => {

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

  // });


});
