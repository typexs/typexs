import { fromEvent, merge, Observable, Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  QueryList,
  Renderer2,
  SimpleChanges,
  ViewChildren
} from '@angular/core';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith, tap } from 'rxjs/operators';
import { IScrollEvent } from './IScrollEvent';
import { IInfiniteScrollApi } from './IInfiniteScrollApi';
import { convertStringToNumber } from '../../lib/functions';


/**
 * TODO
 * - placeholder when max entries are known (only on div scroll element)
 * - loading gear on fetch
 * - switch between overflow and simple mode
 * -
 *
 *
 */
@Directive({
  // standalone: true,
  selector: '[infiniteScroll]'
})
export class InfiniteScrollDirective implements OnChanges, IInfiniteScrollApi {

  @ViewChildren('rows')
  rows: QueryList<any>;

  @Input()
  mode: 'simple' | 'overflow' = 'overflow';

  @Input()
  captureOn: 'scroll' | 'end' = 'scroll';

  @Input('infiniteScroll')
  onoff: boolean = false;

  @Input()
  refresh: boolean = false;

  @Input()
  adaptScrollbar!: boolean;

  @Input()
  rowItems!: QueryList<any>;

  /**
   * use also sub-directive
   */
  @Input('scrollElement')
  scrollElement: any;

  @Output('onBottom')
  onBottom: EventEmitter<IScrollEvent> = new EventEmitter<IScrollEvent>();

  @Input()
  /**
   * When max entries are set extend the scroll placehoder element by
   * (maxEntries - showedEntries) * (entry.size + between)
   */
  maxEntries: number = undefined;

  placeholderElements: any = [];

  /**
   * Loading is finished
   */
  private isFinished: boolean;

  private previousBottom: number = undefined;

  private movingDirection: 'up' | 'down' | 'none' = 'none';

  /**
   * Mark if mouse or cursor is over the component
   */
  private cursorFocuses = false;

  private unlistenMouseEnter: () => void;

  private unlistenMouseLeave: () => void;

  private scrollObservable: Observable<any>;

  private scrollSubscription: Subscription;

  private rowSubscription: Subscription;


  constructor(
    private elemRef: ElementRef,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {

  }


  ngOnChanges(changes: SimpleChanges) {
    const cOnOff = changes['onoff'];
    const cRefresh = changes['refresh'];
    const cMode = changes['mode'];
    const cAdaptScrollbar = changes['adaptScrollbar'];
    if (cOnOff) {
      if (cOnOff.currentValue) {
        this.enable();
      } else {
        this.disable();
      }
    }
    if (cRefresh) {
      if (cRefresh.currentValue !== cRefresh.previousValue) {
        this.disable();
        this.enable();
        this.refresh = false;
      }
    }
    if (cMode) {
      if (cMode.currentValue !== cMode.previousValue) {
        this.disable();
        this.enable();
      }
    }
    if (cAdaptScrollbar) {
      if (((cAdaptScrollbar && cAdaptScrollbar.currentValue !== cAdaptScrollbar.previousValue)) && this.isPlaceholderMode()) {
        this.updatePlaceHolder();
        this.listenForRowChanges();
      }
    }

  }

  /**
   * Attach infinite scrolling relevent event listener
   *
   * - scroll listener should be only listening when mouse is over the component
   * - scroll in div or append at the end
   */
  enable() {
    this.disable();
    if (this.mode === 'overflow') {
      this.enableOverflow();
    } else {
      this.enableBody();
    }
  }


  private enableBody() {
    this.listenOnScroll();
    this.scrollSubscription = this.scrollObservable.subscribe(this.onScrollBody.bind(this));
  }


  private enableOverflow() {
    const scollEl = this.getScrollElement() as HTMLElement;
    if (this.mode === 'overflow') {
      this.renderer2.setStyle(scollEl, 'overflow', 'auto');
      if (!scollEl.style.height) {
        // TODO make height configurable by value or by function
        // TODO add padding-right cause scrollbar makes frame width smaller by 12px (ps. calculate scrollbar width)
        const top = scollEl.offsetParent.getBoundingClientRect().bottom;
        let height = this.document.documentElement.clientHeight - top;
        height = height - height * 0.2;
        if (height < 500) {
          height = 500;
        }
        this.renderer2.setStyle(scollEl, 'height', height + 'px');
      }
    }
    this.unlistenMouseEnter = this.renderer2.listen(scollEl, 'mouseenter', this.onMouseEnter.bind(this));
    this.listenOnScroll(scollEl);
  }

  updatePlaceHolder() {
    const elem = this.getElement();
    const placeholders = elem.querySelectorAll(':scope > .placeholder');
    // TODO if node count is the same as maxEntries and no placehoder exists, then do notthing
    const elemCount = elem.childElementCount - placeholders.length;
    console.log('updatePlaceHolder', elemCount, this.maxEntries);
    if (elemCount >= this.maxEntries - 1) {
      placeholders.forEach(x => this.renderer2.removeChild(elem, x));
      return;
    }

    let prevIdx = -1;
    let prevElem = null;
    let sumHeight = 0;
    let sumItems = 0;
    for (let i = 0; i < elem.childNodes.length; i++) {
      const subelem = elem.childNodes.item(i) as HTMLElement;
      if (!(subelem instanceof HTMLElement)) {
        continue;
      }
      const isPlaceHolder = subelem.classList.contains('placeholder');
      if (isPlaceHolder) {
        // check if it should be shortend
        this.renderer2.removeChild(elem, subelem);
        // this.placeholderElements.
        continue;
      }
      sumHeight += subelem.clientHeight;
      // TODO add distance between should be added
      sumItems++;
      const idx = convertStringToNumber(subelem.getAttribute('idx'));
      const offsetIdx = idx - prevIdx;

      if (offsetIdx > 1 && prevElem) {
        // missing something
        const _elem = this.createElem(idx, prevIdx, offsetIdx);
        this.renderer2.insertBefore(elem, _elem, subelem);
      }
      prevElem = subelem;
      prevIdx = idx;
    }

    const offsetIdx = this.maxEntries - prevIdx - 1;
    if (offsetIdx > 1 && prevElem) {
      // missing something
      const _elem = this.createElem(this.maxEntries, prevIdx, offsetIdx);
      this.renderer2.appendChild(elem, _elem);
    }

    const size = sumHeight / sumItems;
    elem.querySelectorAll('.placeholder').forEach(el => {
      const amount = convertStringToNumber(el.getAttribute('size'));
      this.renderer2.setStyle(el, 'height', amount * size + 'px');
    });
  }


  private createElem(idx: number, prevIdx: number, offsetIdx: number) {
    const _elem = this.renderer2.createElement('div') as HTMLElement;
    _elem.classList.add('placeholder');
    _elem.setAttribute('size', offsetIdx + '');
    _elem.setAttribute('from', (prevIdx + 1) + '');
    _elem.setAttribute('to', (idx - 1) + '');
    // this.placeholderElements.push(_elem);
    return _elem;
  }


  private disable() {
    if (this.unlistenMouseLeave) {
      this.unlistenMouseLeave();
      this.unlistenMouseLeave = undefined;
    }
    if (this.unlistenMouseEnter) {
      this.unlistenMouseEnter();
      this.unlistenMouseEnter = undefined;
    }
    const scrollEl = this.getElement() as HTMLElement;
    if (scrollEl && scrollEl.style && scrollEl.style.overflow) {
      this.renderer2.removeStyle(scrollEl, 'overflow');
      this.renderer2.removeStyle(scrollEl, 'height');
    }
    // remove placeholder some exist if exist
    scrollEl.querySelectorAll('.placeholder').forEach(el => {
      this.renderer2.removeChild(scrollEl, el);
    });
    this._resetRefs();
  }


  private _resetRefs() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
      this.scrollSubscription = undefined;
    }
    if (this.rowSubscription) {
      this.rowSubscription.unsubscribe();
      this.rowSubscription = undefined;
    }
    this.scrollObservable = undefined;
    this.cursorFocuses = false;
    this.previousBottom = undefined;
    this.scrollElement = undefined;
  }


  private onMouseEnter() {
    this.cursorFocuses = true;
    this.unlistenMouseLeave = this.renderer2
      .listen(this.getScrollElement(), 'mouseleave', this.onMouseLeave.bind(this));
    this.scrollSubscription = this.scrollObservable.subscribe(this.onScrollOverflow.bind(this));
  }


  private onMouseLeave() {
    this.cursorFocuses = false;
    this.scrollSubscription.unsubscribe();
    this.scrollSubscription = null;
    this.unlistenMouseLeave();
    if (!this.scrollElement) {
      // TODO check if CSS or TempRef or ElemRef
      this.scrollElement = this.elemRef.nativeElement;
      this.movingDirection = 'none';
    }
  }


  private isOverflowMode() {
    return this.mode === 'overflow';
  }


  private isPlaceholderMode() {
    return typeof this.maxEntries === 'number' && this.maxEntries >= 0 && this.adaptScrollbar;
  }


  getScrollElement(): HTMLElement | Window {
    if (!this.scrollElement) {
      // TODO check if CSS or TempRef or ElemRef
      if (this.isOverflowMode()) {
        this.scrollElement = this.elemRef.nativeElement;
      } else {
        this.scrollElement = window;
        // this.scrollElement = this.document.documentElement;
      }
    }
    return this.scrollElement;
  }


  getElement(): HTMLElement {
    return this.elemRef.nativeElement;
  }


  /**
   *
   * TODO:
   * - in which direction the scroll goes, if we go up then we done have to call bottom reached
   * - scale which records should be loaded
   * - switch between scroll div with overflow and without
   * - trigger when top reached
   *
   * @param event
   * @private
   */
  private onScrollOverflow(event: Event) {
    console.log(event);
    const scrollEl = this.getElement();
    this._onScroll(scrollEl, event);
  }


  private onScrollBody(event: Event) {
    // const windowEl = this.getScrollElement() as Window;
    const documentEl = this.document.documentElement;
    this._onScroll(documentEl, event);
  }


  private _onScroll(scrollEl: HTMLElement, event: Event): void {
    const scrollElemTop = scrollEl.getBoundingClientRect().top;

    const viewTop = scrollEl.scrollTop;
    let diff = 0;
    if (this.isOverflowMode()) {
      diff = (scrollElemTop - viewTop);
    } else {
      diff = -viewTop;
    }

    // top pixel of view frame
    // full scroll height
    let scrollHeight = 0;
    const nodes = this.getElement().querySelectorAll(':scope > div:not(.placeholder)');
    if (nodes.length > 0) {
      const lastEl = nodes[nodes.length - 1];
      if (lastEl) {
        scrollHeight = lastEl.getBoundingClientRect().bottom - diff;
      }
    }
    // const scrollHeight = scrollEl.scrollHeight;
    // bottom limit of scroll
    const viewBottom = viewTop + scrollEl.clientHeight;
    if (this.previousBottom) {
      if (this.previousBottom <= viewBottom) {
        this.movingDirection = 'down';
      } else {
        this.movingDirection = 'up';
      }
    } else {
      this.movingDirection = 'down';
    }
    this.previousBottom = viewBottom;

    const viewFrame = scrollEl.clientHeight * .5;
    const reachBorder = scrollHeight - viewFrame;

    /*
     * Find element idx in view frame
     */
    // const childCount = scrollEl.childElementCount;
    const idx = this.getElementIdxForFrame(viewTop, viewBottom, diff);
    // check if bottom is near or reached
    const scrollEvent: IScrollEvent = {
      type: 'bottom', api: this, idx: idx, top: viewTop, bottom: viewBottom, diff: diff, direction: this.movingDirection
    };

    if (reachBorder <= viewBottom && this.movingDirection === 'down') {
      console.log(scrollEvent);
      this.onBottom.emit(scrollEvent);
    }
  }


  private getElementIdxForFrame(viewTop: number, viewBottom: number, diff = 0) {
    const idx = [];
    const scrollEl = this.getElement();
    for (let i = 0; i < scrollEl.childNodes.length; i++) {
      const elem = scrollEl.childNodes.item(i) as HTMLElement;
      if (elem && elem.getBoundingClientRect && !elem.classList.contains('.placeholder')) {
        const elemBnd = elem.getBoundingClientRect();
        const elemTop = elemBnd.top - diff;
        const elemBottom = elemBnd.bottom - diff;
        // elem.setAttribute('cb', JSON.stringify(elemBnd));
        // elem.setAttribute('xt', elemTop + '');
        // elem.setAttribute('xb', elemBottom + '');
        if (elemBottom > viewTop && elemTop < viewBottom) {
          idx.push(i);
        } else if (idx.length > 0) {
          // abort
          break;
        }
      }
    }
    return idx;
  }


  private listenOnScroll(scollEl?: HTMLElement | Window) {
    if (!scollEl) {
      scollEl = this.getScrollElement();
    }

    const scrollEnd = fromEvent(scollEl, 'scrollend');
    const scroll = fromEvent(scollEl, 'scroll');

    this.scrollObservable = merge(scroll, scrollEnd)
      .pipe(
        // untilDestroyed(),
        tap(x => console.log(x)),
        map((value, index) => {
          value['_scrollTop'] = scollEl instanceof Window ? scollEl.scrollY : (scollEl).scrollTop;
          return value;
        }),
        startWith(0),
        distinctUntilChanged((x, y) => x['_scrollTop'] === y['_scrollTop']),
        debounceTime(25),
        shareReplay(1)
      );


  }


  private listenForRowChanges() {
    if (this.rowItems && !this.rowSubscription) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      // const self = this;
      this.rowSubscription = this.rowItems.changes.subscribe(x => {
        if (this.isPlaceholderMode()) {
          this.updatePlaceHolder();
        }
      });
    }
  }


}
