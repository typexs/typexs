import { fromEvent, Observable, Subscription } from 'rxjs';
import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, EventEmitter, Inject, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { IScrollEvent } from './IScrollEvent';
import { IInfiniteScrollApi } from './IInfiniteScrollApi';

@Directive({
  // standalone: true,
  selector: '[infiniteScroll]'
})
export class InfiniteScrollDirective implements OnInit, OnChanges, IInfiniteScrollApi {

  private _onoff: boolean;

  @Input('infiniteScroll')
  onoff: boolean = false;

  /**
   * use also sub-directive
   */
  @Input('scrollElement')
  scrollElement: any;

  @Output('onBottom')
  onBottom: EventEmitter<IScrollEvent> = new EventEmitter<IScrollEvent>();

  /**
   * Loading is finished
   */
  isFinished: boolean;

  private unlistenMouseEnter: () => void;

  private unlistenMouseLeave: () => void;

  private scrollObservable: Observable<any>;

  private scrollSubscription: Subscription;

  /**
   * Mark if mouse or cursor is over the component
   */
  cursorFocuses = false;


  constructor(
    private elemRef: ElementRef,
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {

  }

  ngOnInit() {
    if (!this.scrollElement) {
      // TODO check if CSS or TempRef or ElemRef
      this.scrollElement = this.elemRef.nativeElement;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['onoff']) {
      if (changes['onoff'].currentValue) {
        this.enable();
      } else {
        this.disable();
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

    this.renderer2.setStyle(
      this.getScrollElement(), 'overflow', 'auto');

    if (!this.getScrollElement().style.height) {
      this.renderer2.setStyle(
        this.getScrollElement(), 'height', '400px');
    }

    this.unlistenMouseEnter = this.renderer2.listen(
      this.getScrollElement(),
      'mouseenter',
      this.onMouseEnter.bind(this));
    this.scrollObservable = fromEvent(
      this.getScrollElement(),
      'scroll'
    )
      .pipe(
        debounceTime(100),
        map(() => this.getScrollElement().scrollTop),
        distinctUntilChanged());

  }

  disable() {
    if (this.unlistenMouseLeave) {
      this.unlistenMouseLeave();
      this.unlistenMouseLeave = undefined;
    }
    if (this.unlistenMouseEnter) {
      this.unlistenMouseEnter();
      this.unlistenMouseEnter = undefined;
    }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    this.scrollObservable = null;
    this.cursorFocuses = false;

    if (this.getScrollElement() && this.getScrollElement().style.overflow) {
      this.renderer2.removeStyle(this.getScrollElement(), 'overflow');
    }

  }


  private onMouseEnter() {
    this.cursorFocuses = true;
    this.unlistenMouseLeave = this.renderer2
      .listen(
        this.getScrollElement(),
        'mouseleave',
        this.onMouseLeave.bind(this));
    this.scrollSubscription = this.scrollObservable.subscribe(this.onScroll.bind(this));
  }

  private onMouseLeave() {
    this.cursorFocuses = false;
    this.scrollSubscription.unsubscribe();
    this.scrollSubscription = null;
    this.unlistenMouseLeave();
  }

  getBoundries(elem: HTMLElement) {
    return elem.getBoundingClientRect();
  }


  getScrollElement(): HTMLElement {
    return this.scrollElement;
  }


  private onScroll(event: Event) {
    const tbody = this.getScrollElement();
    const viewTop = tbody.scrollTop;
    const scrollHeight = tbody.scrollHeight;
    const viewBottom = viewTop + tbody.clientHeight;
    const viewFrame = tbody.clientHeight * .5;
    const reachBorder = scrollHeight - viewFrame;


    // TODO check if bottom is near or reached

    console.log(viewTop, viewBottom);

    if (reachBorder <= viewBottom) {
      this.onBottom.emit(<IScrollEvent>{type: 'bottom', source: this});
    }else{
      // TODO fire scroll event
    }

    // const elements = this.getElementsInViewPort(tbody, viewTop, viewBottom);
    // const placeholder = elements.filter(x => x.classList.contains('placeholder'));
    // if (placeholder.length > 0) {
    //   const first = elements[0];
    //   const last = elements[elements.length - 1];
    //
    //   const startIdxAttr = first.getAttribute('idx');
    //   const endIdxAttr = last.getAttribute('idx');
    //
    //   let startIdx = parseInt(startIdxAttr, 10);
    //   let endIdx = parseInt(endIdxAttr, 10);
    //
    //   if (startIdx > 0) {
    //     startIdx = startIdx - 1;
    //   }
    //
    //   if (endIdx > 0) {
    //     endIdx = endIdx + 1;
    //     //
    //     // if (endIdx >= this.maxRows) {
    //     //   endIdx = this.maxRows - 1;
    //     // }
    //   }
    //
    //   // this.getDataNodes().doChangeSpan(startIdx, endIdx).subscribe(x => {
    //   });

    // }


    // const scrollBottomOffset = tbody.scrollHeight - tbody.offsetHeight;
    // const bottomReached = scrollBottomOffset - tbody.scrollTop <= 0;
    // const topReached = tbody.scrollTop < tbody.offsetHeight / 2.;
    // Log.info('scroll', scrollBottomOffset, tbody.scrollTop, tbody.scrollHeight, bottomReached, topReached, this.getBoundries(tbody));
    // // this.elemRef.nativeElement as HT
    //
    // if (bottomReached) {
    //   this.onBottomReached();
    // }
  }

  // getElementsInViewPort(tbody: HTMLElement, viewTop: number, viewBottom: number) {
  //   const elements = [];
  //   for (let i = 0; i < tbody.childNodes.length; i++) {
  //     const tr = tbody.childNodes.item(i) as HTMLElement;
  //     if (tr.offsetTop >= viewTop && (tr.offsetTop + tr.clientHeight) <= viewBottom) {
  //       elements.push(tr);
  //     } else {
  //       if (elements.length > 0) {
  //         break;
  //       }
  //     }
  //
  //   }
  //   return elements;
  // }
  //

  // getCurrentScrollViewYBoundries() {
  //   const scrollElement = this.getScrollElement();
  //   // get offset to table
  //   let offsetRootTop = scrollElement.offsetTop;
  //   if (scrollElement.tagName.toLocaleLowerCase() === 'tbody') {
  //     // need thead for offset calulation if exists
  //     const theadElem = scrollElement.parentElement.querySelector('thead');
  //     if (theadElem) {
  //       offsetRootTop += theadElem.offsetTop;
  //     }
  //   }
  //   // const scrollBounds = scrollElement.getBoundingClientRect();
  //   const viewTop = scrollElement.scrollTop;
  //   const viewBottom = scrollElement.scrollTop + scrollElement.clientHeight;
  //
  //   return {
  //     top: viewTop,
  //     bottom: viewBottom,
  //     offsetTop: offsetRootTop
  //   };
  // }

  // getElementsInScrollView() {
  //   const scrollElement = this.getScrollElement();
  //   const boundries = this.getCurrentScrollViewYBoundries();
  //   // const start = false;
  //   const viewTop = boundries.top;
  //   const viewBottom = boundries.bottom;
  //   const offsetRootTop = boundries.offsetTop;
  //   const ret: any = {
  //     top: viewTop,
  //     height: boundries.bottom - viewTop,
  //     meanEntryHeight: 0,
  //     bottom: viewBottom,
  //     entries: []
  //   };
  //   const elements = [];
  //   for (let i = 0; i < scrollElement.childNodes.length; i++) {
  //     const x = scrollElement.childNodes.item(i) as HTMLElement;
  //     if (x) {
  //       if (x.classList && x.classList.contains('placeholder')) {
  //         break;
  //       }
  //       const offsetTop = x.offsetTop - offsetRootTop;
  //       if (viewTop <= offsetTop && offsetTop <= viewBottom) {
  //         const z: any = {
  //           top: offsetTop,
  //           bottom: offsetTop + x.offsetHeight,
  //           entry: x
  //         };
  //         z.height = z.bottom - z.top;
  //         if (ret.entries.length > 0) {
  //           z.paddingTop = z.top - ret.entries[ret.entries.length - 1].bottom;
  //         }
  //         ret.entries.push(z);
  //       } else if (elements.length > 0) {
  //         break;
  //       }
  //     }
  //   }
  //
  //   const heights = ret.entries.filter((x: any) => typeof x.height !== 'undefined').map((x: any) => x.height);
  //   const paddingTops = ret.entries.filter((x: any) => typeof x.paddingTop !== 'undefined').map((x: any) => x.paddingTop);
  //
  //   ret.meanEntryHeight = mean(heights);
  //   ret.meanEntryPadding = mean(paddingTops);
  //
  //   if (ret.entries.length > 0) {
  //     const first = ret.entries[0];
  //     const last = ret.entries[ret.entries.length - 1];
  //     ret.firstTop = first.top;
  //     ret.lastBottom = last.bottom;
  //     ret.startIdx = parseInt(first.entry.getAttribute('idx'), 10);
  //     ret.endIdx = parseInt(last.entry.getAttribute('idx'), 10);
  //     const bottomEmptySpace = ret.lastBottom - ret.firstTop;
  //     const missing = ret.bottom - ret.top - bottomEmptySpace;
  //     ret.possibleAdditional = 0;
  //     if (missing > 0) {
  //       const amount = missing / (ret.meanEntryHeight + ret.meanEntryPadding);
  //       if (amount > 0) {
  //         ret.possibleAdditional = Math.ceil(amount);
  //       }
  //     }
  //   }
  //
  //   return ret;
  // }
  //
  //
  // private onBottomReached() {
  //   // check if data nodes
  //   // this.getDataNodes().nextView();
  // }
  //
  //
  // checkIfLoadNeeded() {
  //   if (this.getDataNodes().isReachedMaxRows()) {
  //     return;
  //   }
  //   const tbody = this.getScrollElement();
  //
  //   const firstElem = tbody.querySelector('tr:first-child');
  //   const lastElem = tbody.querySelector('tr:not(.placeholder):last-child');
  //
  //   // this.getDataNodes().fetch()
  //   const offsetTop = tbody.scrollTop;
  //   const offsetBottom = tbody.scrollTop + tbody.offsetHeight;
  //   const lastBottom = lastElem.clientTop + lastElem.clientHeight;
  //
  //   if (lastBottom < offsetBottom) {
  //     // new records to load
  //     // this.getDataNodes().fetchNext();
  //   } else {
  //     // no need to load
  //   }
  // }


}
