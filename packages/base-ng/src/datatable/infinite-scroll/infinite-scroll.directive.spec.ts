import { Component, DebugElement, QueryList, Type, ViewChild, ViewChildren } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { InfiniteScrollDirective } from './infinite-scroll.directive';
import { By } from '@angular/platform-browser';
import { range } from 'lodash';
import { scrollTo } from '../../lib/document.functions';
import { CommonModule } from '@angular/common';
import { IScrollEvent } from './IScrollEvent';


// TODO NOTE test "factor" up oder down
// TODO check if fire onScroll on bottom of element
// TODO mode switch check between simple / overflow
// TODO refresh


/**
 * Tests for infinite scroll
 */
describe('directive: InfiniteScrollDirective', () => {
  let component: any;
  let fixture: ComponentFixture<any>;
  let div: DebugElement;
  let directive: InfiniteScrollDirective;
  let el: HTMLElement;
  let events: IScrollEvent[] = [];
  let originalTimeout: number = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  const newEntry = (x: number) => {
    return { id: x, name: 'Row ' + x };
  };


  const getFixture = (klass: Type<any>) => {
    // originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    TestBed.configureTestingModule({
      imports: [
        CommonModule
      ],
      declarations: [
        InfiniteScrollDirective,
        klass
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(klass);
    component = fixture.componentInstance;
    events = [];
    return fixture;
  };

  const applyList = (list: any[] = []) => {
    component.list = list;
    fixture.detectChanges();
    directive = component.directive;
    el = directive.getElement();
    div = fixture.debugElement.query(By.directive(InfiniteScrollDirective));
  };

  const calcTop = (el: HTMLElement) => {
    el.style.marginTop = (100 - el.getBoundingClientRect().top) + 'px';
    (window as any).screen = {
      height: 1000,
      width: 1900
    };
  };

  const testBedEmpty = (klass: Type<any>) =>
    () => {
      fixture = getFixture(klass);
      applyList();
      calcTop(el);
    };


  const testBedBeforeWithEntries = (klass: Type<any>, numberOfEntries = 10) =>
    () => {
      fixture = getFixture(klass);
      applyList([...range(0, numberOfEntries + 1).map(x => newEntry(x))]);
      calcTop(el);
    };


  const testBedBeforeWithEntriesAndPlaceholderAtBegin = (klass: Type<any>, numberAtBeginning = 10, sizeOfPlaceholder = 10) =>
    () => {
      fixture = getFixture(klass);
      applyList();
      const commentNode = el.childNodes.item(0);
      const elem = directive['createPlaceHolder'](sizeOfPlaceholder, -1, sizeOfPlaceholder);
      directive.getElement().insertBefore(elem, commentNode);
      directive['applyPlaceHolderHeight']();
      component.list.push(...range(sizeOfPlaceholder, sizeOfPlaceholder + numberAtBeginning).map(x => newEntry(x)));
      fixture.detectChanges();
      calcTop(el);
    };

  const testBedBeforeWithEntriesAndPlaceholderAtMiddle = (klass: Type<any>, numberOfEntries = 10, numberOfPlaceholder = 10) =>
    () => {
      fixture = getFixture(klass);
      applyList([...range(0, numberOfEntries).map(x => newEntry(x))]);
      const commentNode = el.childNodes.item(el.childNodes.length - 1);
      const elem = directive['createPlaceHolder'](numberOfEntries + numberOfPlaceholder, numberOfEntries - 1, numberOfPlaceholder);
      directive.getElement().insertBefore(elem, commentNode);
      directive['applyPlaceHolderHeight']();
      fixture.detectChanges();
      component.list.push(
        ...range(numberOfEntries + numberOfPlaceholder, numberOfEntries + numberOfPlaceholder + numberOfEntries)
          .map(x => newEntry(x)));
      fixture.detectChanges();
      calcTop(el);
    };

  const testBedBeforeWithEntriesAndPlaceholderAtEnd = (klass: Type<any>, numberOfEntries = 10, numberOfPlaceholder = 10) =>
    () => {
      fixture = getFixture(klass);
      applyList([...range(0, numberOfEntries).map(x => newEntry(x))]);
      const commentNode = el.childNodes.item(el.childNodes.length - 1);
      const elem = directive['createPlaceHolder'](numberOfEntries + numberOfPlaceholder, numberOfEntries, numberOfPlaceholder);
      directive.getElement().insertBefore(elem, commentNode);
      directive['applyPlaceHolderHeight']();
      fixture.detectChanges();
      calcTop(el);
    };

  const doScroll = (scrollElement: HTMLElement, position: { top: number, left: number }, eventType = 'scroll') => {
    scrollTo(scrollElement, position);
    let scroll = new Event(eventType);
    scrollElement.dispatchEvent(scroll);
    fixture.detectChanges();
    tick(50);
    fixture.detectChanges();
  };

  const onReached = function($event: IScrollEvent) {
    events.push($event);
    if ($event && $event.loadIdx) {
      const toLoad = $event.loadIdx;
      if (toLoad.length > 0) {
        // this.rows.changes.pipe(first()).subscribe((x: any) => {
        //   $event.api.onItemsChange(
        //     {
        //       start: Math.min(...toLoad),
        //       end: Math.max(...toLoad)
        //     },
        //     $event
        //   );
        // });
        const rows = toLoad
          .filter(x => this.list.findIndex((y: any) => y.id === x) === -1)
          .map(x => newEntry(x));
        const merge = [...this.list, ...rows];
        merge.sort((a, b) => a.id - b.id);
        this.list = merge;
      }
    }
  };

  afterEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('general input checks', () => {

    @Component({
      template: `
        <div [infiniteScroll]="onoff"
             [mode]="mode"
             [maxEntries]="maxEntries"
             [factor]="factor"
             [refresh]="refresh"
             [finished]="finished"
             (onDataScroll)="onReached($event)"
             class="container">
          <div class="row" #rows [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>`,
      styles: [
        '.row { height: 20px; margin-top:1px }'
      ]
    })
    class ITCInputs {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      @ViewChildren('rows')
      rows: QueryList<any>;

      list: any[] = [];

      onoff: boolean = false;

      mode: 'simple' | 'overflow' = 'overflow';

      maxEntries: number | undefined = undefined;

      factor: number = 100;

      refresh: boolean = false;

      finished: boolean = false;

      onReached = onReached.bind(this);
    }

    beforeEach(waitForAsync(testBedEmpty(ITCInputs)));

    it('check if directive is offline', () => {
      expect(directive).not.toBeUndefined();
      expect(directive.onoff).toBeFalse();
      expect(directive['scrollSubscription'] === undefined).toBeTrue();
    });

    it('check if directive is online', () => {
      component.onoff = true;
      fixture.detectChanges();
      expect(directive.onoff).toBeTrue();
      expect(directive['scrollSubscription'] !== undefined).toBeTrue();
    });

  });

  describe('scroll in overflow mode', () => {

    @Component({
      template: `
        <div [infiniteScroll]="onoff"
             (onDataScroll)="onReached($event)"
             class="container">
          <div class="row" #rows [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>`,
      styles: [
        '.row { height: 20px; margin-top:1px }'
      ]
    })
    class ITC {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      list: any[] = [];

      onoff: boolean = false;

      onReached = onReached.bind(this);
    }

    beforeEach(waitForAsync(testBedEmpty(ITC)));

    // afterEach(() => {
    //   component.ngOnDestroy();
    // })

    it('enter and leave scroll element', fakeAsync(() => {
      component.onoff = true;
      fixture.detectChanges();

      const scrollElement = directive.getScrollElement() as HTMLElement;
      const boundires = scrollElement.getBoundingClientRect();
      const scrollHeight = scrollElement.scrollHeight;
      const scrollTop = scrollElement.scrollTop;

      expect(boundires.height).toEqual(500);
      expect(scrollHeight).toBeGreaterThanOrEqual(500);
      expect(scrollTop).toEqual(0);

      expect(directive['cursorFocuses']).toBeFalse();
      div.triggerEventHandler('mouseenter', {});
      tick(20);
      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeTrue();
      div.triggerEventHandler('mouseleave', {});
      tick(20);
      fixture.detectChanges();
      expect(directive['cursorFocuses']).toBeFalse();
      tick(20);
    }));

    it('check if load on startup works', fakeAsync(() => {
      expect(component.list).toHaveSize(0);
      expect(div.childNodes.length).toEqual(1);
      expect(directive.approxParams).toEqual({ height: 16, margin: 2 });
      component.onoff = true;
      fixture.detectChanges();
      // div.triggerEventHandler('mouseenter', {});
      tick(50);
      fixture.detectChanges();
      expect(events).toHaveSize(1);
      expect(events[0].type).toEqual('init');
      expect(component.list).toHaveSize(56);
      expect(div.childNodes.length).toEqual(57);
      directive.onItemsChange();
      expect(directive.approxParams).toEqual({ height: 20, margin: 1 });
      expect(directive.getItemCount()).toEqual(56);
    }));

    it('scroll down', fakeAsync(() => {
      const scrollElement = directive.getScrollElement() as HTMLElement;
      expect(component.list).toHaveSize(0);
      expect(div.childNodes.length).toEqual(1);
      expect(directive.approxParams).toEqual({ height: 16, margin: 2 });
      // mouse entering table body enables scroll listener
      component.onoff = true;
      fixture.detectChanges();
      tick(50);
      fixture.detectChanges();

      // initial load
      directive.onItemsChange();
      expect(events).toHaveSize(1);
      expect(component.list.length).toEqual(56);
      expect(directive.getItemCount()).toEqual(56);
      expect(directive.approxParams).toEqual({ height: 20, margin: 1 });

      // reaching bottom load more as in view box
      doScroll(scrollElement, { top: 500, left: 0 });
      directive.onItemsChange();
      expect(events).toHaveSize(2);
      expect(scrollElement.scrollTop).toEqual(500);
      expect(directive['movingDirection']).toEqual('down');
      expect(component.list.length).toEqual(56);
      expect(directive.getItemCount()).toEqual(56);

      // only scroll in view box
      doScroll(scrollElement, { top: 1000, left: 0 });
      directive.onItemsChange();
      expect(events).toHaveSize(3);
      expect(scrollElement.scrollTop).toEqual(1000);
      expect(directive['movingDirection']).toEqual('down');
      expect(component.list.length).toEqual(96);
      expect(directive.getItemCount()).toEqual(96);
    }));

    it('scroll up', fakeAsync(() => {
      const scrollElement = directive.getScrollElement() as HTMLElement;
      expect(component.list).toHaveSize(0);
      expect(div.childNodes.length).toEqual(1);
      expect(directive.approxParams).toEqual({ height: 16, margin: 2 });
      // mouse entering table body enables scroll listener
      component.onoff = true;
      fixture.detectChanges();
      tick(50);
      fixture.detectChanges();

      directive.onItemsChange();
      expect(events).toHaveSize(1);
      expect(component.list.length).toEqual(56);
      expect(directive.getItemCount()).toEqual(56);

      doScroll(scrollElement, { top: 2000, left: 0 });
      directive.onItemsChange();
      expect(events).toHaveSize(2);
      expect(scrollElement.scrollTop).toEqual(2000);
      expect(directive['movingDirection']).toEqual('down');
      expect(component.list.length).toEqual(104);
      expect(directive.getItemCount()).toEqual(104);
      expect(directive.getPlaceHolderElements().length).toEqual(1);
      expect(directive.getPlaceHolderElements().item(0).getAttribute('from')).toEqual('56');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('to')).toEqual('94');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('size')).toEqual('40');
      expect(directive['highestIdx']).toEqual(142);


      doScroll(scrollElement, { top: 1600, left: 0 });
      directive.onItemsChange();
      expect(events).toHaveSize(3);
      expect(scrollElement.scrollTop).toEqual(1600);
      expect(directive['movingDirection']).toEqual('up');
      expect(component.list.length).toEqual(123);
      expect(directive.getItemCount()).toEqual(123);
      expect(directive['highestIdx']).toEqual(142);
      expect(directive.getPlaceHolderElements().length).toEqual(1);
      expect(directive.getPlaceHolderElements().item(0).getAttribute('from')).toEqual('56');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('to')).toEqual('75');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('size')).toEqual('21');

      doScroll(scrollElement, { top: 1200, left: 0 });
      directive.onItemsChange();
      expect(events).toHaveSize(4);
      expect(scrollElement.scrollTop).toEqual(1200);
      expect(directive['movingDirection']).toEqual('up');
      expect(component.list.length).toEqual(142);
      expect(directive.getItemCount()).toEqual(142);
      expect(directive['highestIdx']).toEqual(142);
      expect(directive.getPlaceHolderElements().length).toEqual(0);
      // expect(directive.getPlaceHolderElements().item(0).getAttribute('from')).toEqual('28');
      // expect(directive.getPlaceHolderElements().item(0).getAttribute('to')).toEqual('56');
      // expect(directive.getPlaceHolderElements().item(0).getAttribute('size')).toEqual('30');

    }));

    xit('TODO scale factor value up', () => {
    });

    xit('TODO scale factor down', () => {
    });

  });

  describe('scroll in overflow mode with maxEntries', () => {

    @Component({
      template: `
        <div [infiniteScroll]="onoff"
             [maxEntries]="maxEntries"
             (onDataScroll)="onReached($event)"
             class="container">
          <div class="row" #rows [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>`,
      styles: [
        '.row { height: 20px; margin-top:1px }'
      ]
    })
    class ITC {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      @ViewChildren('rows')
      rows: QueryList<any>;

      list: any[] = [];

      onoff: boolean = true;

      maxEntries: number = undefined;

      onReached = onReached.bind(this);
    }

    beforeEach(waitForAsync(testBedEmpty(ITC)));

    it('check if placeholder is set on maxEntries', fakeAsync(() => {
      const se = directive.getScrollElement() as HTMLElement;
      component.maxEntries = 100;
      component.refresh = true;
      fixture.detectChanges();
      tick(50);
      fixture.detectChanges();
      directive.onItemsChange();
      expect(se.scrollHeight).toBeGreaterThanOrEqual(1000);
      expect(directive.getPlaceHolderElements().length).toEqual(1);
      expect(directive.getPlaceHolderElements().item(0).getAttribute('from')).toEqual('56');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('to')).toEqual('99');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('size')).toEqual('44');
    }));

  });

  describe('scroll in simple mode', () => {

    @Component({
      template: `
        <div infiniteScroll
             [mode]="mode"
             (onDataScroll)="onReached($event)"
             class="container">
          <div class="row" #rows [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>`,
      styles: [
        '.row { height: 20px; margin-top:1px }'
      ]
    })
    class ITC {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      @ViewChildren('rows')
      rows: QueryList<any>;

      list: any[] = [];

      onoff: boolean = true;

      mode: any = 'simple';

      onReached = onReached.bind(this);
    }

    beforeEach(waitForAsync(testBedEmpty(ITC)));

    it('check if is correctly initialized', fakeAsync(() => {
      fixture.detectChanges();
      directive.onItemsChange();
      const se = directive.getScrollElement() as Window;
      const elem = directive.getElement() as HTMLElement;
      expect(se).toBeInstanceOf(Window);
      // console.log(JSON.stringify(se.screen));
      // console.log(JSON.stringify(elem.getBoundingClientRect()));
      // @ts-ignore
      expect(se !== elem).toBeTrue();
      const erg = (Math.ceil((elem.getBoundingClientRect().height - 1) / 21) + 1);
      expect(elem.childNodes.length).toEqual(erg);
      expect(directive.getItemCount()).toEqual(erg - 1);

      expect(se.scrollY).toBeGreaterThanOrEqual(0);
      expect(directive.getPlaceHolderElements().length).toEqual(0);
    }));


  });

  describe('scroll in simple mode with maxEntries', () => {

    @Component({
      template: `
        <div infiniteScroll
             [mode]="mode"
             [maxEntries]="maxEntries"
             (onDataScroll)="onReached($event)"
             class="container">
          <div class="row" #rows [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>`,
      styles: [
        '.row { height: 20px; margin-top:1px }'
      ]
    })
    class ITC {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      @ViewChildren('rows')
      rows: QueryList<any>;

      list: any[] = [];

      mode: any = 'simple';

      maxEntries = 100;

      onReached = onReached.bind(this);
    }

    beforeEach(waitForAsync(testBedEmpty(ITC)));

    it('check if is correctly initialized', fakeAsync(() => {
      fixture.detectChanges();
      directive.onItemsChange();
      const se = directive.getScrollElement() as Window;
      const elem = directive.getElement() as HTMLElement;
      expect(se).toBeInstanceOf(Window);
      // @ts-ignore
      expect(se !== elem).toBeTrue();
      expect(elem.childNodes.length).toEqual(27);
      expect(directive.getItemCount()).toEqual(25);

      // const scrollBounding = se.document.documentElement.getBoundingClientRect();
      // const elBounding = elem.getBoundingClientRect();
      expect(directive.getPlaceHolderElements().length).toEqual(1);
      expect(directive.getPlaceHolderElements().item(0).getAttribute('from')).toEqual('25');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('to')).toEqual('99');
      expect(directive.getPlaceHolderElements().item(0).getAttribute('size')).toEqual('75');
    }));

  });

  describe('check helper methods for index calculation', () => {
    @Component({
      template: `
        <div [infiniteScroll]="onoff"
             [maxEntries]="maxEntries"
             [mode]="mode"
             (onDataScroll)="onRangeReached($event)"
             class="container">
          <div #rows class="row" [attr.idx]="row.id" *ngFor="let row of list">
            <div class="col-12">{{ row.name }}</div>
          </div>
        </div>
      `,
      styles: [
        'row {height: 40px }'
      ]
    })
    class ITCAdapt {

      @ViewChild(InfiniteScrollDirective)
      directive: InfiniteScrollDirective;

      list: any[] = [];

      mode: 'simple' | 'overflow' = 'simple';

      maxEntries = 1000;

      onoff: boolean = true;


      onRangeReached($event: IScrollEvent) {
        events.push($event);
      }
    }


    describe('initialise tests', () => {
      beforeEach(testBedEmpty(ITCAdapt));

      it('should create', () => {
        expect(directive).toBeTruthy();
        expect(directive.onoff).toBeTrue();
        expect(directive.maxEntries).toEqual(1000);
      });
    });

    describe('check nearest element scenarios', () => {
      let idx = -100;

      describe('nearest element for empty list', () => {

        beforeEach(testBedEmpty(ITCAdapt));

        it('from 0 offset 0', () => {
          const idx = directive['getNearestElement'](el, 0, 0);
          expect(idx).toEqual(-1);
        });

        it('from 0 offset 0 reverse', () => {
          const idx = directive['getNearestElement'](el, 0, 0, true);
          expect(idx).toEqual(-1);
        });

        it('from 10 offset 0', () => {
          const idx = directive['getNearestElement'](el, 10, 0, false);
          expect(idx).toEqual(-1);
        });

        it('from 10 offset 0 reverse', () => {
          const idx = directive['getNearestElement'](el, 10, 0, true);
          expect(idx).toEqual(-1);
        });

        it('from 10 offset 1000', () => {
          const idx = directive['getNearestElement'](el, 10, 1000, false);
          expect(idx).toEqual(-1);
        });

        it('from 10 offset 1000 reverse', () => {
          const idx = directive['getNearestElement'](el, 10, 1000, true);
          expect(idx).toEqual(-1);
        });

      });


      describe('nearest element for list with 10 elements', () => {

        beforeEach(testBedBeforeWithEntries(ITCAdapt, 10));

        it('from 20 offset 1000', () => {
          // NOTE: no entries are after 20
          idx = directive['getNearestElement'](el, 20, 1000);
          expect(idx).toEqual(-1);
        });


        it('from 0 offset 1000', () => {
          // NOTE: no entries are after 0 which have > 1000, max is 10
          idx = directive['getNearestElement'](el, 0, 1000);
          expect(idx).toEqual(-1);
        });

        it('from 20 offset 1000 reverse', () => {
          // NOTE: lowest entry is at 10
          idx = directive['getNearestElement'](el, 20, 1000, true);
          expect(idx).toEqual(10);
        });

        it('from 0 offset 150', () => {
          // NOTE: no entries are after 0 which have > 1000, max is 10
          idx = directive['getNearestElement'](el, 0, 150);
          expect(idx).toEqual(2);
        });

        it('from 6 offset 150 reverse', () => {
          // NOTE: no entries are after 0 which have > 1000, max is 10
          idx = directive['getNearestElement'](el, 6, 150, true);
          expect(idx).toEqual(2);
        });

      });


      describe('list with placeholder', () => {

        describe('placeholder at beginning', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtBegin(ITCAdapt, 10, 10));

          it('from 0 offset 0', () => {
            idx = directive['getNearestElement'](el, 0, 0);
            expect(idx).toEqual(1);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(10 + '');
          });

          it('from 0 offset 0 reverse', () => {
            idx = directive['getNearestElement'](el, 0, 0, true);
            expect(idx).toEqual(-1);
          });

          it('from 0 offset 400', () => {
            idx = directive['getNearestElement'](el, 0, 400);
            expect(idx).toEqual(7);
          });

          it('from 0 offset 400 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 0, 400, true);
            expect(idx).toEqual(7);
          });

          it('from 5 offset 400', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, false);
            expect(idx).toEqual(7);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(16 + '');
          });

          it('from 5 offset 400 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, true);
            expect(idx).toEqual(7);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(16 + '');
          });

          it('from 50 offset 2000', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, false);
            expect(idx).toEqual(-1);
            // const node = el.childNodes.item(idx) as HTMLElement;
            // expect(node.getAttribute('idx')).toEqual(39 + '');
          });

          it('from 50 offset 2000 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, true);
            expect(idx).toEqual(10);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(19 + '');
          });

        });

        describe('placeholder in the middle', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtMiddle(ITCAdapt, 10, 10));

          it('from 0 offset 0', () => {
            idx = directive['getNearestElement'](el, 0, 0);
            expect(idx).toEqual(0);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(0 + '');
          });

          it('from 0 offset 0 reverse', () => {
            idx = directive['getNearestElement'](el, 0, 0, true);
            expect(idx).toEqual(-1);
          });

          it('from 0 offset 350', () => {
            idx = directive['getNearestElement'](el, 0, 350);
            expect(idx).toEqual(11);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(20 + '');
          });

          it('from 0 offset 350 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 0, 350, true);
            expect(idx).toEqual(9);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(9 + '');
          });

          it('from 5 offset 400', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, false);
            expect(idx).toEqual(11);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(20 + '');
          });

          it('from 5 offset 400 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, true);
            expect(idx).toEqual(9);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(9 + '');
          });

          it('from 50 offset 2000', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, false);
            expect(idx).toEqual(-1);
          });

          it('from 50 offset 2000 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, true);
            expect(idx).toEqual(20);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(29 + '');
          });
        });

        describe('placeholder at the end', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtEnd(ITCAdapt, 40, 40));

          it('from 0 offset 0', () => {
            idx = directive['getNearestElement'](el, 0, 0);
            expect(idx).toEqual(0);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(0 + '');
          });

          it('from 0 offset 0 reverse', () => {
            idx = directive['getNearestElement'](el, 0, 0, true);
            expect(idx).toEqual(-1);
          });

          it('from 0 offset 400', () => {
            idx = directive['getNearestElement'](el, 0, 400);
            expect(idx).toEqual(16);
          });

          it('from 0 offset 400 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 0, 400, true);
            expect(idx).toEqual(16);
          });

          it('from 5 offset 400', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, false);
            expect(idx).toEqual(16);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(16 + '');
          });

          it('from 5 offset 400 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 5, 400, true);
            expect(idx).toEqual(16);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(16 + '');
          });

          it('from 50 offset 2000', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, false);
            expect(idx).toEqual(-1);
          });

          it('from 50 offset 2000 reverse', () => {
            // NOTE: nearest element to offset 0 beginning with index 0 from last to first
            idx = directive['getNearestElement'](el, 50, 2000, true);
            expect(idx).toEqual(39);
            const node = el.childNodes.item(idx) as HTMLElement;
            expect(node.getAttribute('idx')).toEqual(39 + '');
          });
        });
      });
    });

    describe('viewbox index lookup', () => {


      describe('approximated index for viewbox', () => {
        let idxs;

        beforeEach(testBedBeforeWithEntries(ITCAdapt, 10));

        it('get approximated index range for a viewbox 0 to 180', () => {
          idxs = directive['getApproxRangeForViewBox']({ top: 0, bottom: 180, diff: 0 });
          expect(idxs).toEqual({ start: 0, end: 10 });
        });

        it('get approximated index range for a viewbox 200 to 400', () => {
          idxs = directive['getApproxRangeForViewBox']({ top: 200, bottom: 400, diff: 0 });
          expect(idxs).toEqual({ start: 11, end: 23 });
        });

      });

      describe('get missing index for viewbox', () => {

        describe('empty list', () => {
          beforeEach(testBedEmpty(ITCAdapt));

          it('should missing all entries and all should be approximated', () => {
            // const sEl = directive.getScrollElement();
            // const innerHeight = sEl instanceof Window ? sEl.innerHeight : sEl.clientHeight - el.getBoundingClientRect().top;
            const res = directive['checkViewFrameForMissingIdx']({ top: 0, bottom: 500 }, { margin: 10, height: 20 });
            expect(res).toEqual(range(0, 17));
          });

        });

        describe('list with entries', () => {
          beforeEach(testBedBeforeWithEntries(ITCAdapt, 10));

          /**
           * Check if viewbox is missing entries, it should cause only 5 entries
           */
          it('should missing entries even if some entries are present', () => {
            const res = directive['checkViewFrameForMissingIdx'](
              { top: 0, bottom: 400 },
              { height: 20, margin: 10 });
            expect(res).toEqual(range(11, 23));
          });

          it('should not miss any entry', () => {
            component.list.push(...range(11, 41).map(x => newEntry(x)));
            fixture.detectChanges();
            directive.onItemsChange();
            const res = directive['checkViewFrameForMissingIdx'](
              { top: 0, bottom: 400, diff: 0 },
              { margin: 10, height: 20 });
            expect(res).toEqual([]);
          });

        });

        describe('list with entries and placeholder at begin', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtBegin(ITCAdapt, 10, 10));

          it('viewbox 0-200', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 0, bottom: 200 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(0, 10)]);
          });

          it('viewbox 100-300', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 100, bottom: 300 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(5, 10)]);
          });

          it('viewbox 200-400', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 200, bottom: 400 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(11, 23)]);
          });

          it('viewbox 400-600', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 400, bottom: 600 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(22, 34)]);
          });
        });


        describe('list with entries and placeholder at the middle', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtMiddle(ITCAdapt, 10, 10));

          it('viewbox 0-200', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 0, bottom: 200 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(10, 12)]);
          });

          it('viewbox 100-300', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 100, bottom: 300 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(10, 17)]);
          });

          it('viewbox 200-400', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 200, bottom: 400 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(11, 20)]);
          });

          it('viewbox 400-600', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 400, bottom: 600 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(30, 34)]);
          });
        });


        describe('list with entries and placeholder at the end', () => {

          beforeEach(testBedBeforeWithEntriesAndPlaceholderAtEnd(ITCAdapt, 10, 10));

          it('viewbox 0-200', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 0, bottom: 200 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(10, 12)]);
          });

          it('viewbox 100-300', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 100, bottom: 300 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(10, 17)]);
          });

          it('viewbox 200-400', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 200, bottom: 400 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(11, 23)]);
          });

          it('viewbox 400-600', () => {
            const res = directive['checkViewFrameForMissingIdx']({ top: 400, bottom: 600 }, { margin: 10, height: 20 });
            expect(res).toEqual([...range(22, 34)]);
          });
        });
      });


      // it('check if correctly initialized', fakeAsync(() => {
      //   // const method = spyOn(fixture.componentInstance, 'onRangeReached');
      //   // fixture.detectChanges();
      //   // directive.ngAfterViewInit();
      //   expect(directive['isPlaceholderMode']).toBeTrue();
      //   // directive.reload();
      //   // directive.disable();
      //   // directive.enable();
      //   // expect(method).toHaveBeenCalled();
      // }));


      // it('load initial data', fakeAsync(() => {
      //   const method = spyOn(fixture.componentInstance, 'onRangeReached');
      //   fixture.detectChanges();
      //   expect(directive['isPlaceholderMode']).toBeTrue();
      //   // directive.reload();
      //   // directive.disable();
      //   // directive.enable();
      //   expect(method).toHaveBeenCalled();
      // }));

      // TODO check if quick scroll to blank position loads the necessary data to the position

    });

    describe('viewbox size calculation', () => {

      describe('in overflow mode', () => {

        @Component({
          template: `
            <div infiniteScroll
                 [mode]="mode"
                 (onDataScroll)="onRangeReached($event)"
                 class="container">
              <div #rows class="row" [attr.idx]="row.id" *ngFor="let row of list">
                <div class="col-12">{{ row.name }}</div>
              </div>
            </div>
          `,
          styles: [
            '.row {height: 40px; }'
          ]
        })
        class ITCOverflow {

          @ViewChild(InfiniteScrollDirective)
          directive: InfiniteScrollDirective;

          list: any[] = [];

          mode: 'simple' | 'overflow' = 'overflow';

          onRangeReached($event: IScrollEvent) {
            events.push($event);
          }
        }

        beforeEach(testBedBeforeWithEntries(ITCOverflow, 50));

        it('check box size at begin', () => {
          const se = directive.getScrollElement() as HTMLElement;
          expect(se === el).toBeTrue();
          const size = directive['getViewBox'](se);
          expect(size).toEqual({
            top: 0, bottom: 500, diff: 0, resized: 0, scaled: 500
          });
          const elemIdx = directive['getElementIdxForFrame'](se, size);
          expect(elemIdx).toEqual(range(0, 11));

        });

        it('check box size on scroll', () => {
          const se = directive.getScrollElement() as HTMLElement;
          scrollTo(se, { top: 400, left: 0 });

          const size = directive['getViewBox'](se);
          expect(size).toEqual({
            top: 400, bottom: 900, diff: 0, resized: 0, scaled: 500
          });
          const elemIdx = directive['getElementIdxForFrame'](se, size);
          expect(elemIdx).toEqual(range(7, 21));
        });

      });

      describe('in simple mode', () => {

        @Component({
          template: `
            <div infiniteScroll
                 [mode]="mode"
                 (onDataScroll)="onRangeReached($event)"
                 class="container">
              <div #rows class="row" [attr.idx]="row.id" *ngFor="let row of list">
                <div class="col-12">{{ row.name }}</div>
              </div>
            </div>
          `,
          styles: [
            '.row {height: 40px; }'
          ]
        })
        class ITCSimple {

          @ViewChild(InfiniteScrollDirective)
          directive: InfiniteScrollDirective;

          list: any[] = [];

          mode: 'simple' | 'overflow' = 'simple';

          onRangeReached($event: IScrollEvent) {
            events.push($event);
          }
        }

        beforeEach(testBedBeforeWithEntries(ITCSimple, 50));

        it('check box size at begin', fakeAsync(() => {
          tick(100);
          fixture.detectChanges();
          let se = directive.getScrollElement() as any;
          expect(se !== el).toBeTrue();
          expect(se).toBeInstanceOf(Window);
          scrollTo(se, { top: 0, left: 0 });
          directive.onItemsChange();
          se = (se as Window).document.documentElement;
          const size = directive['getViewBox'](se);
          expect(size.top).toEqual(0);
          expect(size.bottom).toEqual(441);
          const elemIdx = directive['getElementIdxForFrame'](el, size);
          expect(elemIdx).toEqual(range(0, 12));
        }));

        it('check box size on scroll', fakeAsync(() => {
          tick(50);
          let se: any = directive.getScrollElement() as Window;
          scrollTo(se, { top: 400, left: 0 });
          directive.onItemsChange();
          se = (se as Window).document.documentElement as HTMLElement;

          const size = directive['getViewBox'](se);
          expect(size.top).toEqual(400);
          expect(size.bottom).toEqual(841);
          const elemIdx = directive['getElementIdxForFrame'](el, size);
          expect(elemIdx).toEqual(range(9, 22));
        }));

      });

    });


  });
});
