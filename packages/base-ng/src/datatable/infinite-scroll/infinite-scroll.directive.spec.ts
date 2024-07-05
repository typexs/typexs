import { Component, DebugElement, Input } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { InfiniteScrollDirective } from './infinite-scroll.directive';
import { By } from '@angular/platform-browser';
import { range } from 'lodash';
import { BrowserTestingModule } from '@angular/platform-browser/testing';
import { scrollTo } from '../../lib/document.functions';


/**
 * Tests for infinite scroll
 */
describe('directive: infinite-scroll', () => {

  /**
   * check if directive can be enable / disabled by attr prefix
   */
  describe('handle scrolling', () => {

    @Component({
      template: '' +
        '<div [infiniteScroll]="onoff" class="container" >' +
        '<div class="row" *ngFor="let row of list">' +
        '<div class="col-12">{{row.name}}</div>' +
        '</div>' +
        '</div>',
      styles: [
        'row {height: 40px }'
      ]
    })
    class ITC {

      list = range(1, 50)
        .map(x => ({ id: x, name: 'Row ' + x }));

      @Input()
      onoff: boolean = false;
    }

    let component: ITC;
    let fixture: ComponentFixture<ITC>;
    let div: DebugElement;
    let directive: InfiniteScrollDirective;

    beforeEach(waitForAsync(() => {
      fixture = TestBed.configureTestingModule({
        imports: [
          BrowserTestingModule
        ],
        declarations: [
          InfiniteScrollDirective,
          ITC
        ]
      }).createComponent(ITC);
      component = fixture.componentInstance;
      fixture.detectChanges();

      div = fixture.debugElement.query(By.directive(InfiniteScrollDirective));
      directive = div.injector.get(InfiniteScrollDirective);
    }));

    it('check if directive is offline', () => {
      expect(directive).not.toBeUndefined();
      expect(directive.onoff).toBeFalse();
      expect(directive['unlistenMouseEnter'] === undefined).toBeTrue();
    });

    it('check if directive is online', () => {
      component.onoff = true;
      fixture.detectChanges();
      expect(directive.onoff).toBeTrue();
      expect(directive['unlistenMouseEnter'] !== undefined).toBeTrue();
    });


    /**
     * Enter and leave scroll element
     */
    it('enter and leave scroll element', fakeAsync(() => {
      component.onoff = true;
      fixture.detectChanges();

      const scrollElement = directive.getScrollElement() as HTMLElement;

      const boundires = scrollElement.getBoundingClientRect();
      const scrollHeight = scrollElement.scrollHeight;
      const scrollTop = scrollElement.scrollTop;

      expect(boundires.height).toEqual(500);
      expect(scrollHeight).toBeGreaterThan(600);
      expect(scrollTop).toEqual(0);

      expect(directive['cursorFocuses']).toBeFalse();
      div.triggerEventHandler('mouseenter', {});
      // tick(10);
      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeTrue();
      div.triggerEventHandler('mouseleave', {});
      // tick(10);
      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeFalse();
    }));


    /**
     * Scroll down
     */
    it('scroll down', fakeAsync(() => {
      // mouse entering table body enables scroll listener
      component.onoff = true;
      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeFalse();
      div.triggerEventHandler('mouseenter', {});
      // tick(10);

      // // Fälle:
      // // 1. höhe der geladenen Datensätz <= tbody.scrollHeight -> weitere nachladen, da sichtbereich nicht ausgefüllt
      // // 2. höhe der geladenen Datensätz > tbody.scrollHeight -> tue nix
      // // 3. ---


      // do not reached bottom
      const scrollElement = directive.getScrollElement() as HTMLElement;
      scrollTo(scrollElement, { top: 200, left: 0 });
      let scroll = new Event('scroll');
      scrollElement.dispatchEvent(scroll);
      tick(150);
      fixture.detectChanges();

      let scrollTop = scrollElement.scrollTop;
      expect(scrollTop).toEqual(200);

      // do reach bottom
      scrollTo(scrollElement, { top: 400, left: 0 });
      scroll = new Event('scroll');
      scrollElement.dispatchEvent(scroll);
      tick(150);
      fixture.detectChanges();

      scrollTop = scrollElement.scrollTop;
      expect(scrollTop).toEqual(400);


      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeTrue();
      div.triggerEventHandler('mouseleave', {});

    }));

  });

  // TODO check if fire onScroll on bottom of element

  // TODO mode switch check

  // TODO refresh

});
