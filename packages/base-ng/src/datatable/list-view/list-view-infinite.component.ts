// import { AfterViewInit, ChangeDetectorRef, Component, Input, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
// import { AbstractGridComponent } from '../api/abstract-grid.component';
// import { PagerService } from '../../pager/PagerService';
// import { IDatatableListGridOptions } from './IDatatableListGridOptions';
// import { IGridMode, K_INFINITE, K_INITIALIZE, K_OPTIONS, K_PAGED, K_VIEW } from '../api/IGridMode';
// import { TemplateDirective } from '../Template.directive';
// import { IGridEvent } from '../api/IGridEvent';
// import { IScrollEvent } from '../infinite-scroll/IScrollEvent';
// import { Subscription } from 'rxjs';
// import { first } from 'rxjs/operators';
// import { InfiniteScrollDirective } from '../infinite-scroll/infinite-scroll.directive';
//
//
// @Component({
//   selector: 'txs-list-view-infinite',
//   templateUrl: 'list-view-infinite.component.html',
//   styleUrls: ['./list-view-infinite.component.scss']
// })
// export class ListViewInfiniteComponent extends AbstractGridComponent implements AfterViewInit {
//
//   @ViewChildren(TemplateDirective)
//   templateRefs: QueryList<TemplateDirective>;
//
//   @ViewChildren('rows')
//   rowItems: QueryList<any>;
//
//   @Input()
//   allowViewModeSwitch: boolean = true;
//
//   @Input()
//   viewMode: string = 'teaser';
//
//   @Input()
//   options: IDatatableListGridOptions;
//
//   infiniteOnOff: boolean = true;
//
//   refresh: boolean;
//
//   update: boolean;
//
//   sub: Subscription;
//
//   private _selectedTemplateName: string = null;
//   private _selectedTemplate: TemplateRef<any>;
//
//   constructor(
//     public pagerService: PagerService,
//     public changeRef: ChangeDetectorRef
//   ) {
//     super(pagerService, changeRef);
//     this.gridReady.subscribe(x => this.onGridReady(x));
//   }
//
//   ngOnInit() {
//     if(this.getViewMode() === K_INFINITE){
//       this.getOptions().queryOnInit = false;
//     }
//     super.ngOnInit();
//
//   }
//
//   ngAfterViewInit() {
//   }
//
//   onGridReady(x: IGridEvent) {
//     if (x.event === K_OPTIONS && x.api.getViewMode() === K_INFINITE) {
//       this.refresh = false;
//     } else if (x.event === K_INITIALIZE) {
//
//     }
//   }
//
//   setViewMode(viewMode: string) {
//     if (viewMode === K_INFINITE) {
//       this.infiniteOnOff = true;
//       this.getOptions().queryOnInit = false;
//     } else {
//       this.getOptions().queryOnInit = undefined;
//       this.infiniteOnOff = false;
//     }
//     super.setViewMode(viewMode);
//   }
//
//   supportedViewModes(): IGridMode[] {
//     return [
//       { name: K_VIEW, label: K_VIEW },
//       { name: K_PAGED, label: K_PAGED },
//       { name: K_INFINITE, label: K_INFINITE }
//     ];
//   }
//
//
//   selectedTemplate() {
//     const gridMode = this.getViewMode();
//     if (this._selectedTemplateName !== gridMode || !this._selectedTemplate) {
//       this._selectedTemplateName = gridMode;
//       if (this.sub) {
//         this.sub.unsubscribe();
//         this.sub = undefined;
//       }
//       this._selectedTemplate = this.getTemplate(gridMode);
//     }
//     return this._selectedTemplate;
//   }
//
//   getTemplate(templateName: string): TemplateRef<any> {
//     if (this.templateRefs) {
//       return this.templateRefs
//         .toArray()
//         .find(x => x.name.toLowerCase() === templateName.toLowerCase()).template;
//     } else {
//       return null;
//     }
//   }
//
//
//   onDataScroll($event: IScrollEvent) {
//     // TODO if initial
//     const boundries = this.getDataNodes().getFrameBoundries();
//     const range = boundries.range;
//     let start = boundries.end;
//     let end = start + boundries.range;
//     if($event && $event.loadIdx.length > 0){
//       const _start = Math.min(...$event.loadIdx);
//       const _end = Math.max(...$event.loadIdx);
//       start = Math.floor(_start / range) * range;
//       end = Math.ceil(_end / range) * range;
//
//       this.getDataNodes().doChangeSpan(start, end).subscribe(x => {
//         // this.rowItems.changes.pipe(first()).subscribe(x => {
//         // setTimeout(x => )
//           $event.api.onItemsChange({start: start, end: end}, $event);
//         // });
//       });
//     }
//
//   }
// }
