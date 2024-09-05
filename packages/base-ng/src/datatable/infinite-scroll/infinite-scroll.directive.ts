import { fromEvent, merge, Observable, Subject, Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  SimpleChanges
} from '@angular/core';
import { debounceTime, distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';
import { IScrollEvent, T_SCROLL } from './IScrollEvent';
import { IInfiniteScrollApi } from './IInfiniteScrollApi';
import { convertStringToNumber } from '../../lib/functions';
import { IIndexSpan } from '../../lib/datanodes/IIndexSpan';
import { IViewBox } from './IViewBox';
import { clone, isNumber, orderBy, range, remove, uniq } from 'lodash';
import { IViewCheckOptions, IViewCheckParamCapture } from './Constants';
import { Log } from './../../lib/log/Log';


const K_SCROLL_TOP = '_scrollTop';
const K_DOWN = 'down';
const K_UP = 'up';

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
  selector: '[infiniteScroll]'
})
export class InfiniteScrollDirective implements OnChanges, IInfiniteScrollApi, OnDestroy, OnInit {

  @Input()
  mode: 'simple' | 'overflow' = 'overflow';

  @Input()
  captureOn: ('scroll' | 'scrollend')[] = ['scroll', 'scrollend'];

  @Input('infiniteScroll')
  onoff: boolean;

  _enabled = false;

  @Input()
  refresh: boolean = false;

  /**
   * use also sub-directive
   */
  @Input()
  scrollElement: any;

  /**
   * When max entries are set extend the scroll placehoder element by
   * (maxEntries - showedEntries) * (entry.size + between)
   */
  @Input()
  maxEntries: number;

  @Input()
  approxHeight = 16;

  @Input()
  approxMargin = 2;

  /**
   * The factor stretches the viewbox by resizing it. When 100 the viewbox is as it is given.
   */
  @Input()
  factor = 100;

  /**
   * Loading is finished
   */
  @Input()
  finished: boolean = false;

  /**
   * CSS selector for items
   */
  @Input()
  itemSelector: string | Function =
    (
      (node: ChildNode) =>
        node && node instanceof HTMLElement &&
        (node.classList.contains('item') || node.hasAttribute('idx')) ? true : false
    );

  @Input()
  skipInit = false;

  @Output()
  onDataScroll: EventEmitter<IScrollEvent> = new EventEmitter<IScrollEvent>();

  private previousBottom: number = undefined;

  private movingDirection: 'up' | 'down' | 'none' = 'none';

  private debounceTime = 50;
  /**
   * Mark if mouse or cursor is over the component
   */
  private cursorFocuses = false;

  private unlistenMouseEnter: () => void;

  private unlistenMouseLeave: () => void;

  private scrollObservable: Observable<any>;

  private scrollSubscription: Subscription;

  private subject = new Subject<Event | 0>();

  private afterItemsUpdate = new Subject<any>();

  private afterItemsUpdateSubscription: Subscription;

  nodeCount = 0;

  highestIdx = -1;

  itemObserver: MutationObserver;

  lastEvent: IScrollEvent;

  approxParams: IViewCheckOptions = {
    height: this.approxHeight,
    margin: this.approxMargin
  };

  constructor(
    private elemRef: ElementRef,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {
  }

  ngOnInit() {
    if (typeof this.onoff !== 'boolean') {
      // enable if not set
      this.onoff = true;
      this.enable();
    }

    this.afterItemsUpdateSubscription = this.afterItemsUpdate.pipe(
      // distinctUntilChanged((x, y) => x.top === y.top && x.bottom === y.bottom)
      debounceTime(this.debounceTime)
    )
      .subscribe(x => {
        this.onItemsChange();
      });

    this.itemObserver = new MutationObserver((mutations) => {
      const remoteAppend = mutations.find((x: MutationRecord) => {
        for (let i = 0; i < x.addedNodes.length; i++) {
          const node = x.addedNodes.item(i);
          if (this.isEntry(node)) {
            return true;
          }
        }
        return false;
      });
      if (remoteAppend) {
        // TODO get first and last idx
        this.afterItemsUpdate.next(mutations.length);
      }
    });
    this.itemObserver.observe(this.getElement(), { childList: true });
  }

  ngOnDestroy() {
    this.disable();
    if (this.itemObserver) {
      this.itemObserver.disconnect();
      this.itemObserver = null;
    }
    this.afterItemsUpdate.complete();
    if (this.afterItemsUpdateSubscription) {
      this.afterItemsUpdateSubscription.unsubscribe();
      this.afterItemsUpdateSubscription = undefined;
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    let mode: number[] = [];
    const cOnOff = changes['onoff'];
    const cRefresh = changes['refresh'];
    const cMode = changes['mode'];
    const cMaxEntries = changes['maxEntries'];
    if (cOnOff) {
      if (cOnOff.currentValue) {
        mode.push(1);
      } else {
        mode.push(2);
      }
    }
    if (cRefresh) {
      if (cRefresh.currentValue !== cRefresh.previousValue && cRefresh.currentValue) {
        mode.push(3);
      }
    }
    if (cMode) {
      if (cMode.currentValue !== cMode.previousValue) {
        mode.push(3);
      }
    }

    if (mode.includes(1)) {
      this.enable();
    } else if (mode.includes(2)) {
      this.disable();
    } else if (mode.includes(3)) {
      this.reload();
      if (this.refresh) {
        this.refresh = false;
      }
    }

    if (cMaxEntries) {
      if (((cMaxEntries && cMaxEntries.currentValue !== cMaxEntries.previousValue))) {
        if (!this.skipInit) {
          if (this._enabled) {
            this.subject.next(0);
          } else {
            this.enable();
          }
        }
        this.afterItemsUpdate.next(0);
      }
    }
  }


  reload() {
    this.disable();
    this.enable();
  }


  /**
   * Attach infinite scrolling relevent event listener
   *
   * - scroll listener should be only listening when mouse is over the component
   * - scroll in div or append at the end
   */
  enable() {
    if (!this.onoff || this._enabled) {
      return;
    }
    this._enabled = true;
    this.disable();
    if (this.isOverflowMode()) {
      this.enableOverflow();
    } else {
      this.enableBody();
    }
  }

  private registerScroll(fn: Function) {
    this.scrollSubscription = this.scrollObservable.subscribe(fn.bind(this));
  }

  private unregisterScroll() {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
      this.scrollSubscription = undefined;
    }
    this.scrollObservable = undefined;
  }


  private enableBody() {
    this.listenOnScroll();
    this.registerScroll(this.onScrollBody);
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
    this.registerScroll(this.onScrollOverflow);
  }


  private disable() {
    this._enabled = false;
    if (this.unlistenMouseLeave) {
      this.unlistenMouseLeave();
      this.unlistenMouseLeave = undefined;
    }
    if (this.unlistenMouseEnter) {
      this.unlistenMouseEnter();
      this.unlistenMouseEnter = undefined;
    }
    this.highestIdx = -1;
    const element = this.getElement() as HTMLElement;
    if (element && element.style && element.style.overflow) {
      this.renderer2.removeStyle(element, 'overflow');
      this.renderer2.removeStyle(element, 'height');
    }
    // remove placeholder some exist if exist
    this.getPlaceHolderElements().forEach(el => {
      this.renderer2.removeChild(element, el);
    });
    this._resetRefs();
  }


  private _resetRefs() {
    this.unregisterScroll();
    this.cursorFocuses = false;
    this.previousBottom = undefined;
    this.scrollElement = undefined;
  }


  /**
   * Remote callback for signal the data ist loaded and the view is actualised.
   *
   * TODO example
   *
   * @param boundries
   * @param scroll
   */
  onItemsChange(boundries?: IIndexSpan, scroll?: IScrollEvent) {
    this.calcReload(boundries);
    this.updatePlaceHolder();
  }


  private calcReload(boundries?: IIndexSpan) {
    // update internal node count
    const el = this.getElement();
    this.calcShownNodes(el);
    this.applyCalcApproxOffsets(el, 10, boundries, this.approxParams);
  }

  /**
   * Calculate how many entries are already in the container object present.
   * Without the angular comment and placeholder entries.
   *
   * @param el
   * @private
   */
  private calcShownNodes(el?: HTMLElement) {
    if (!el) {
      el = this.getElement();
    }
    // const plchldr = this.getPlaceHolderElements();
    const x = this.getNoneItemElements();
    this.nodeCount = el.childElementCount - x.length;
    return this.nodeCount;
  }


  /**
   * Return the items shown in the container element
   */
  getItemCount(forceCalc = false) {
    if (forceCalc) {
      this.calcShownNodes();
    }
    return this.nodeCount;
  }

  getMaxEntries() {
    if (this.maxEntries > 0) {
      return this.maxEntries;
    }
    return this.highestIdx + 1;
  }


  /**
   * Mouse enter directive element callback
   *
   * @private
   */
  private onMouseEnter() {
    this.cursorFocuses = true;
    this.unlistenMouseLeave = this.renderer2
      .listen(this.getScrollElement(), 'mouseleave', this.onMouseLeave.bind(this));
  }

  /**
   * Mouse leaves directive element callback
   *
   * @private
   */
  private onMouseLeave() {
    this.cursorFocuses = false;
    this.unlistenMouseLeave();
    // if (!this.scrollElement) {
    //   // TODO check if CSS or TempRef or ElemRef
    //   this.scrollElement = this.elemRef.nativeElement;
    //   this.movingDirection = 'none';
    // }
  }


  /**
   * Is directive mode overflow set
   *
   * @private
   */
  private isOverflowMode() {
    return this.mode === 'overflow';
  }


  /**
   * Check if placeholder mode ist enabled, which means that the scrollbar should be
   * extended by stretching the content of element containing the entries
   *
   * @private
   */
  private isPlaceholderMode() {
    return typeof this.maxEntries === 'number' && this.maxEntries >= 0;
  }


  /**
   * Get the scroll element
   *
   * @return HTMLElement
   */
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

  getInnerHeight() {
    const se = this.getScrollElement();
    if (se instanceof Window) {
      return window.innerHeight;
    } else {
      return se.clientHeight;
    }
  }


  /**
   * Get the element which is the holder for elements
   */
  getElement(): HTMLElement {
    return this.elemRef.nativeElement;
  }

  /**
   * Check if passed node is an entry in the list
   *
   * @param el
   * @return boolean
   */
  isEntry(el: HTMLElement | ChildNode | Node) {
    if (typeof this.itemSelector === 'function') {
      return this.itemSelector(el);
    }
    return el && el instanceof HTMLElement && el.classList.contains(this.itemSelector);
  }


  /**
   *  Scroll in div overflow
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
    const scrollEl = this.getElement();
    this._onScroll(scrollEl, event);
  }


  /**
   * Scroll on full window
   *
   * @param event
   * @private
   */
  private onScrollBody(event: Event) {
    const documentEl = this.document.documentElement;
    this._onScroll(documentEl, event);
  }

  /**
   * Triggered on scroll event
   * - checks if records are missing in current view box
   * - trigger registered callback
   *
   * @param scrollEl
   * @param event
   * @private
   */
  private _onScroll(scrollEl: HTMLElement, event: Event): void {
    const viewBox = this.getViewBox(scrollEl);
    const viewTop = viewBox.top;
    const viewBottom = viewBox.bottom; // Top + scrollEl.clientHeight;
    const diff = viewBox.diff; // Top + scrollEl.clientHeight;

    // full scroll height
    let scrollHeight = 0;
    // TODO optimize this!
    const nodes = this.getElement().querySelectorAll(':scope > div:not(.placeholder)');
    if (nodes.length > 0) {
      const lastEl = nodes[nodes.length - 1];
      if (lastEl) {
        scrollHeight = lastEl.getBoundingClientRect().bottom - diff;
      }
    }
    // bottom limit of scroll
    if (this.previousBottom) {
      if (this.previousBottom <= viewBottom) {
        this.movingDirection = K_DOWN;
      } else {
        this.movingDirection = K_UP;
      }
    } else {
      this.movingDirection = K_DOWN;
    }
    this.previousBottom = viewBottom;

    const viewFrame = scrollEl.clientHeight * .5;
    const reachBorder = scrollHeight - viewFrame;
    const bottomReached = reachBorder <= viewBottom && this.movingDirection === K_DOWN;

    let extendViewBox = false;
    let type: T_SCROLL = 'scroll';
    if (event === null || (isNumber(event) && event === 0)) {
      // in init mode
      type = 'init';
      extendViewBox = true;
      if (this.skipInit) {
        // sometimes initial data are already present
        return;
      }
    } else if (bottomReached) {
      type = 'bottom';
      extendViewBox = true;
    }

    if (extendViewBox && !this.isPlaceholderMode()) {
      // bottom reached extend search for new items
      viewBox.bottom = viewBox.bottom + viewBox.scaled;
    }

    // const options: IViewCheckOptions = { height: this.approxHeight, bottomMargin: this.approxMargin };
    const capture: IViewCheckParamCapture = {};
    const missingIdx = this.checkViewFrameForMissingIdx(viewBox, this.approxParams, capture);
    if (missingIdx.length > 0 || (capture.elemIdx && capture.elemIdx.length > 0)) {
      const maxIdx = Math.max(...missingIdx, ...(capture.elemIdx ? capture.elemIdx : []));
      if (this.highestIdx < maxIdx) {
        this.highestIdx = maxIdx;
      }
    }

    const scrollEvent: IScrollEvent = {
      type: type,
      api: this,
      idx: capture.elemIdx,
      top: viewTop,
      bottom: viewBottom,
      nTopIdx: capture.nTopIdx,
      nBottomIdx: capture.nBottomIdx,
      diff: diff,
      direction: this.movingDirection,
      loadIdx: missingIdx
    };
    this.lastEvent = scrollEvent;
    this.onDataScroll.emit(scrollEvent);
  }


  /**
   * Check if loading new records is finished by verifying if externally finished
   * is declared or the number of nodes in the container reaching maxEntries value.
   */
  isFinished() {
    if (typeof this.finished === 'boolean') {
      return this.finished;
    }
    if (typeof this.maxEntries === 'number') {
      // TODO better count for child nodes
      return this.getItemCount(true) >= this.maxEntries;
    }
    return false;
  }

  /**
   * Get the current view top and bottom offset from offset-top and additionally the offset diff
   *
   * TODO make tests for this
   *
   * @param el
   * @private
   */
  private getViewBox(el: HTMLElement): IViewBox {
    const contentOffsetTop = this.getElement().getBoundingClientRect().top;
    // const scrollElemTop = el.getBoundingClientRect().top;
    const scaled = Math.floor(this.factor * el.clientHeight / 100);
    const resize = (scaled - el.clientHeight) / 2;
    const viewTop = el.scrollTop - resize;
    const viewBottom = el.scrollTop + el.clientHeight + resize;

    let diff = 0;
    if (this.isOverflowMode()) {
      // diff = (scrollElemTop - viewTop);
    } else {
      diff = contentOffsetTop;
    }

    return { top: viewTop, bottom: viewBottom, diff: diff, resized: resize, scaled: scaled };
  }

  /**
   *
   *
   * @param offset
   * @param height
   * @param margin
   */
  calcIdxFrom(offset: number, height: number, margin: number): number {
    return (offset - margin) / (height + margin);
  }

  /**
   * Returns all placeholder elements
   *
   * @return HTMLElement[]
   */
  getPlaceHolderElements() {
    return this.getElement().querySelectorAll(':scope > .placeholder');
  }

  /**
   * Return all other elements
   */
  getNoneItemElements() {
    return this.getElement().querySelectorAll(':scope > :not(.item)');
  }


  /**
   * Check a viewbox for missings ids, if nothing missing or finished return an empty array
   *
   * @param viewbox
   * @private
   */
  private checkViewFrameForMissingIdx(viewbox: IViewBox,
    options: IViewCheckOptions = {
      height: 16,
      margin: 2
    }, capture: IViewCheckParamCapture = {}) {
    let ret: number[] = [];
    if (this.isFinished()) {
      return ret;
    }
    const el = this.getElement();
    // oberer Abstand des Container-Elements
    const offsetTop = viewbox.diff ? viewbox.diff : el.getBoundingClientRect().top;
    const viewBoxCopy = clone(viewbox);
    viewBoxCopy.diff = capture.offsetTop = offsetTop;
    // hole wahrscheinliche top und bottom idx für die box
    const indexSpan = this.getApproxRangeForViewBox(viewBoxCopy, options);
    capture.span = indexSpan;
    ret = range(indexSpan.start, indexSpan.end);
    const distance = indexSpan.end - indexSpan.start;
    const spread = 0;

    // bestimme nächsten existierende Index von oben
    const nodeTopIdx = this.getNearestElement(el, indexSpan.start,
      // viewBoxCopy.top + viewBoxCopy.diff - spread
      viewBoxCopy.top - spread
    );
    capture.nTopIdx = nodeTopIdx;
    // bestimme nächsten existierende Index von unten
    const nodeBottomIdx = this.getNearestElement(el, indexSpan.end,
      // viewBoxCopy.bottom + viewBoxCopy.diff + spread
      viewBoxCopy.bottom + spread
      , true);
    capture.nBottomIdx = nodeBottomIdx;

    let startIdx;
    let stopIdx;
    let elemIdx: number[] = [];
    if (nodeTopIdx < 0 && nodeBottomIdx < 0) {
      // no node found, take the approximated
      return ret;
    } else if (nodeTopIdx >= 0 && nodeBottomIdx < 0) {
      // first found, but no last
      startIdx = nodeTopIdx - distance;
      stopIdx = indexSpan.end + 1;
    } else if (nodeTopIdx >= 0 && nodeBottomIdx >= 0) {
      // first and last found
      startIdx = nodeTopIdx - distance;
      stopIdx = nodeBottomIdx + distance;
    } else if (nodeTopIdx < 0 && nodeBottomIdx >= 0) {
      // first not found, but last found
      startIdx = indexSpan.start;
      stopIdx = nodeBottomIdx + distance + 1;
    }
    elemIdx = this.getElementIdxForFrame(el, viewBoxCopy, startIdx, stopIdx, true);
    remove(ret, x => elemIdx.includes(x));

    capture.elemIdx = elemIdx;
    return ret;
  }


  /**
   * Calculate approximate top and bottom index for a given view box
   *
   * @param viewBox
   * @param options
   * @private
   * @return IIndexSpan
   */
  private getApproxRangeForViewBox(
    viewBox: IViewBox,
    options: IViewCheckOptions = {
      height: 16,
      margin: 2
    }): IIndexSpan {
    const el = this.getElement();
    const count = this.getItemCount(true);
    if (count > 0) {
      this.applyCalcApproxOffsets(el, 10, null, options);
    }
    const topApproxIdx = Math.floor(this.calcIdxFrom(viewBox.top, options.height, options.margin));
    const bottomApproxIdx = Math.ceil(this.calcIdxFrom(viewBox.bottom, options.height, options.margin));
    return { start: topApproxIdx < 0 ? 0 : topApproxIdx, end: bottomApproxIdx < 0 ? 0 : bottomApproxIdx };
  }


  /**
   * Return the index of the "item" node which is nearest to the offset. If reverse is true then we are looking
   * for the nearest from top and if it is false we are looking for the nearest from the bottom.
   * If nothing can be found than returns -1. Search is starting from passed index idx.
   *
   * @param el
   * @param idx
   * @param offset
   * @param reverse
   * @param nodes
   * @private
   * @return number
   */
  private getNearestElement(el: HTMLElement, idx: number, offset: number, reverse: boolean = false, nodes: {
    idx: number;
    type: number,
    top: number | null,
    bottom: number | null
  }[] = []): number {
    let retIdx = -1;
    if (nodes.filter(x => x.idx === idx).length > 1) {
      return retIdx;
    }
    if (el.childElementCount === 0) {
      // not elements no search
      return retIdx;
    }

    const entry: { idx: number; type: number, top: number | null, bottom: number | null } = {
      idx: idx,
      type: null,
      top: null,
      bottom: null
    };
    nodes.unshift(entry);

    if (idx < 0) {
      // has previous nodes?
      if (reverse) {
        return -1;
      } else {
        return this.getNearestElement(el, 0, offset, reverse, nodes);
      }
    } else if (idx > el.childNodes.length - 1) {
      return this.getNearestElement(el, el.childNodes.length - 1, offset, reverse, nodes);
    }

    let nextId = -1;

    const node = el.childNodes.item(idx);
    entry.type = node.nodeType;

    if (node instanceof HTMLElement) {
      const boundry = node.getBoundingClientRect();
      entry.top = boundry.top;
      entry.bottom = boundry.bottom;

      retIdx = -1;
      if (offset < boundry.top) {
        const distance = offset - boundry.top;
        // element is under offset, move up (dec)
        // TODO check if previous distances are lower then this
        const nearerNodes = orderBy(
          nodes.filter((x, index) => index > 0 && x.top && (offset - x.top) >= distance), value => offset - value.top);
        if (nearerNodes.length > 0) {
          const wasAlreadyHere = remove(nearerNodes, x => x.idx === idx);
          if (wasAlreadyHere.length > 0) {
            // was already here return back current idx
            if (reverse) {
              // we can get near enough
              return -1;
            } else {
              retIdx = idx;
            }
          } else {
            const nearest = nearerNodes.shift();
            nextId = nearest.idx - 1;
          }
        } else {
          nextId = idx - 1;
        }
      } else if (boundry.top <= offset && offset <= boundry.bottom) {
        // in between, found element for both reverse states
        retIdx = idx;
      } else if (boundry.bottom < offset) {
        // element is above offset, move down
        const distance = boundry.bottom - offset;
        // element is under offset, move up (dec)
        // TODO check if previous distances are lower then this
        const nearerNodes = orderBy(
          nodes.filter((x, index) => index > 0 && x.top && (x.bottom - offset) >= distance), value => value.bottom - offset);
        if (nearerNodes.length > 0) {
          const wasAlreadyHere = remove(nearerNodes, x => x.idx === idx);
          if (wasAlreadyHere.length > 0) {
            // was already here return back current idx
            if (reverse) {
              // we can get near enough
              return -1;
            } else {
              retIdx = idx;
            }
          } else {
            const nearest = nearerNodes.shift();
            nextId = nearest.idx + 1;
          }
        } else {
          nextId = idx + 1;
        }

        // nextId = idx + 1;
      } else {
        // shouldnt happen
      }

      if (retIdx > -1) {
        return this.findNearestItem(el, retIdx, reverse, nodes);
      }
      return this.getNearestElement(el, nextId, offset, reverse, nodes);
    } else {
      // were should we go, when previous data present, then check by top and bottom else by index
      if (nodes.length > 1) {
        const nearerNodes = nodes.filter((x, index) => index > 0);
        const wasAlreadyHere = remove(nearerNodes, x => x.idx === idx);
        const lastElem = !reverse && nearerNodes.length > 0 ?
          nearerNodes.find(x => x.type === 1 && offset <= x.top) :
          nearerNodes.find(x => x.type === 1 && offset >= x.bottom);
        if (wasAlreadyHere.length > 0) {
          // was already here return back current idx
          if (lastElem) {
            retIdx = lastElem.idx;
          } else if (reverse) {
            // we can get near enough
            return -1;
          } else {
            retIdx = idx;
          }
        } else {
          const prevNode = nodes[1];
          if (prevNode.idx < idx) {
            nextId = idx + 1;
          } else {
            nextId = idx - 1;
          }
        }
        if (retIdx > -1) {
          return this.findNearestItem(el, retIdx, reverse, nodes);
        }
      } else {
        nextId = reverse ? idx - 1 : idx + 1;
      }
      return this.getNearestElement(el, nextId, offset, reverse, nodes);
    }
  }

  /**
   * Returns the first found element which is marked as item, starting from passed index.
   *
   * @param el
   * @param idx
   * @param reverse
   * @param cache
   * @private
   */
  private findNearestItem(el: HTMLElement, idx: number, reverse: boolean = false, cache: {}) {
    let countdown = 50;
    let startIdx = idx;
    while (countdown > 0) {
      if (startIdx < 0) {
        return -1;
      } else if (startIdx >= el.childNodes.length) {
        return -1;
      }
      const child = el.childNodes.item(startIdx);
      if (this.isEntry(child)) {
        // is node
        return startIdx;
      }
      if (reverse) {
        startIdx--;
      } else {
        startIdx++;
      }
      countdown--;
    }
    return -1;
  }

  private getElementIdxForFrame(el: HTMLElement, viewbox: IViewBox, startIdx = 0, stopIdx: number = undefined, overlap = false) {
    return this.getElementsForFrame(el, viewbox, startIdx, stopIdx, overlap).map(x => x.realIdx);
  }


  private getElementNrsForFrame(el: HTMLElement, viewbox: IViewBox, startIdx = 0, stopIdx: number = undefined, overlap = false) {
    return this.getElementsForFrame(el, viewbox, startIdx, stopIdx, overlap).map(x => x.idx);
  }

  /**
   * Return idx list for the elements in a view box
   *
   * @param viewTop
   * @param viewBottom
   * @param diff
   * @param startNodeIdx
   * @param stopNodeIdx
   * @private
   */
  private getElementsForFrame(el: HTMLElement, viewbox: IViewBox, startNodeIdx = 0, stopNodeIdx: number = undefined, overlap = false) {
    const idx = [];
    // let c = 0;
    let _stopIdx = el.childNodes.length;
    if (typeof stopNodeIdx === 'number' && stopNodeIdx < _stopIdx && stopNodeIdx >= 0) {
      _stopIdx = stopNodeIdx;
    }
    for (let i = startNodeIdx; i < _stopIdx; i++) {
      const elem = el.childNodes.item(i) as HTMLElement;
      if (this.isEntry(elem)) {
        const idxNr = parseInt(elem.getAttribute('idx'), 10);
        const elemBnd = elem.getBoundingClientRect();
        const elemTop = elemBnd.top - viewbox.diff;
        const elemBottom = elemBnd.bottom - viewbox.diff;
        if (elemBottom >= viewbox.top && elemTop <= viewbox.bottom) {
          idx.push({ idx: i, realIdx: idxNr, elem: elem });
        } else if (overlap && (
          (elemTop >= viewbox.bottom && elemBottom <= viewbox.bottom) ||
          (elemTop >= viewbox.top && elemBottom <= viewbox.top))
        ) {
          idx.push({ idx: i, realIdx: idxNr, elem: elem });
        } else if (idx.length > 0) {
          break;
        }
      }
    }
    return idx;
  }


  private listenOnScroll(scollEl?: HTMLElement | Window) {
    if (this.captureOn.length === 0) {
      throw new Error('listen on scroll capture on is empty.');
    }
    if (!scollEl) {
      scollEl = this.getScrollElement();
    }

    const listenOnEvents = [this.subject, ...this.captureOn.map(x => fromEvent(scollEl, x))] as any[];
    this.scrollObservable = listenOnEvents.length === 1 ? listenOnEvents[0] : merge(...listenOnEvents)
      .pipe(
        map((value, index) => {
          if (typeof value === 'number' && value === 0) {
            return value;
          } else {
            value[K_SCROLL_TOP] = scollEl instanceof Window ? scollEl.scrollY : (scollEl).scrollTop;
            return value;
          }
        }),
        startWith(0),
        distinctUntilChanged(
          (x, y) => x !== 0 && y !== 0 && x[K_SCROLL_TOP] === y[K_SCROLL_TOP]),
        debounceTime(this.debounceTime),
        shareReplay(1)
      );
  }


  calcApproxOffsets(el: HTMLElement, randomPick = 10, boundries: IIndexSpan = null) {
    const b = {
      sumHeight: 0,
      sumMarginBottom: 0,
      height: -1,
      marginBottom: -1,
      count: 0,
      countMargin: 0
    };

    const start = boundries && boundries.start ? boundries.start : 0;
    const stop = boundries && boundries.end <= el.childElementCount - 1 ? boundries.end : el.childElementCount - 1;
    const rands = uniq(range(0, randomPick + 1).map(x => Math.floor(Math.random() * stop) + start));

    for (let i of rands) {
      if (i < 0 || i >= el.childNodes.length || !el.childNodes.item(i)) {
        continue;
      }
      const node = el.childNodes.item(i);
      if (this.isEntry(node)) {
        try {
          b.count++;
          const bound = (node as HTMLElement).getBoundingClientRect();
          b.sumHeight += bound.height;
          if (i > 0 && i < stop) {
            const j = i - 1;
            const prevNode = el.childNodes.item(j);
            if (this.isEntry(prevNode)) {
              const beforeBound = (prevNode as HTMLElement).getBoundingClientRect();
              b.sumMarginBottom += bound.top - beforeBound.bottom;
              b.countMargin++;
            }
          }
        } catch (e) {
          Log.error(e);
        }
      }
    }
    b.height = b.count > 0 ? Math.ceil(b.sumHeight / b.count) : 0;
    b.marginBottom = b.countMargin > 0 ? Math.ceil(b.sumMarginBottom / b.countMargin) : 0;
    return b;
  }

  applyCalcApproxOffsets(el: HTMLElement, pick = 10, boundries: IIndexSpan, options: IViewCheckOptions = { margin: 2, height: 16 }) {
    const approx = this.calcApproxOffsets(el, pick, boundries);
    const height = approx.height;
    const marginBottom = approx.marginBottom;
    if (approx.count > 0 && height > 0) {
      options.height = height;
      if (approx.countMargin > 0) {
        options.margin = marginBottom;
      }
    }
    return options;
  }

  /**
   * Update placeholder, when adapted scrollbar ist enabled
   *
   * TODO write tests for this
   */
  private updatePlaceHolder(startIdx = 0, stopIdx: number = undefined) {
    const elem = this.getElement();
    const placeholders = this.getPlaceHolderElements();
    // TODO if node count is the same as maxEntries and no placeholder exists, then do nothing
    // TODO this node count maybe wrong elements are also ng comments
    const elemCount = this.getItemCount();
    const maxElem = this.getMaxEntries();

    if (elemCount >= maxElem - 1) {
      // placeholder no more necessary
      placeholders.forEach(x => this.renderer2.removeChild(elem, x));
      return;
    }

    let selection = false;
    let prevIdx = -1;
    let prevElem = null;
    let sumItems = 0;
    let _startIdx = 0;
    let _stopIdx = elem.childNodes.length;
    if (typeof stopIdx === 'number' && stopIdx >= 0 && stopIdx < _stopIdx) {
      _stopIdx = stopIdx;
      selection = true;
    }
    if (typeof startIdx === 'number' && startIdx >= 0 && startIdx < _stopIdx) {
      _startIdx = startIdx;
    }

    for (let i = _startIdx; i < _stopIdx; i++) {
      const subelem = elem.childNodes.item(i) as HTMLElement;
      if (!(subelem instanceof HTMLElement)) {
        continue;
      }
      const isPlaceHolder = subelem.classList.contains('placeholder');
      if (isPlaceHolder) {
        // check if it should be shortend
        this.renderer2.removeChild(elem, subelem);
        // change iteration
        _stopIdx--;
        i--;
        continue;
      }

      if (!this.isEntry(subelem)) {
        // TODO unknown element?
        continue;
      }

      sumItems++;
      const idx = convertStringToNumber(subelem.getAttribute('idx'));
      const offsetIdx = idx - prevIdx;

      if (offsetIdx > 1 && prevElem) {
        // missing something
        const _elem = this.createPlaceHolder(idx, prevIdx, offsetIdx);
        this.renderer2.insertBefore(elem, _elem, subelem);
        _stopIdx++;
      }
      prevElem = subelem;
      prevIdx = idx;
    }

    if (!selection) {
      const offsetIdx = maxElem - prevIdx - 1;
      if (offsetIdx > 1 && prevElem) {
        // missing something
        const _elem = this.createPlaceHolder(maxElem, prevIdx, offsetIdx);
        this.renderer2.appendChild(elem, _elem);
      }
    }

    if (sumItems > 0) {
      this.applyPlaceHolderHeight(this.approxParams);
    }

    if (this.lastEvent) {
      this.getElement().scrollTo({ top: this.lastEvent.top });
      this.lastEvent = undefined;
    }
  }

  private applyPlaceHolderHeight(opts?: IViewCheckOptions) {
    if (!opts) {
      opts = this.approxParams;
    }
    this.getPlaceHolderElements().forEach(el => {
      const amount = convertStringToNumber(el.getAttribute('size'));
      const size = amount * (opts.height + opts.margin) - opts.margin;
      this.renderer2.setStyle(el, 'height', size + 'px');
    });
  }


  private createPlaceHolder(toIdx: number, fromIdx: number, offsetIdx: number) {
    const _elem = this.renderer2.createElement('div') as HTMLElement;
    _elem.classList.add('placeholder');
    _elem.setAttribute('size', offsetIdx + '');
    _elem.setAttribute('from', (fromIdx + 1) + '');
    _elem.setAttribute('to', (toIdx - 1) + '');
    // this.placeholderElements.push(_elem);
    return _elem;
  }


}
