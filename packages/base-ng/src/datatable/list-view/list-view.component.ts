import { AfterViewInit, ChangeDetectorRef, Component, Input, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { AbstractGridComponent } from '../api/abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IDatatableListGridOptions } from './IDatatableListGridOptions';
import { IGridMode, K_INFINITE, K_INITIALIZE, K_OPTIONS, K_PAGED, K_VIEW } from '../api/IGridMode';
import { TemplateDirective } from '../Template.directive';
import { IGridEvent } from '../api/IGridEvent';
import { IScrollEvent } from '../infinite-scroll/IScrollEvent';
import { Subscription } from 'rxjs';
import { InfiniteScrollDirective } from '../infinite-scroll/infinite-scroll.directive';


@Component({
  selector: 'txs-list-view',
  templateUrl: 'list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent extends AbstractGridComponent implements AfterViewInit {

  @ViewChildren(TemplateDirective)
  templateRefs: QueryList<TemplateDirective>;

  @ViewChildren('rows')
  rowItems: QueryList<any>;

  @Input()
  allowViewModeSwitch: boolean = true;

  @Input()
  viewMode: string = 'teaser';

  @Input()
  options: IDatatableListGridOptions;

  infiniteOnOff: boolean = true;

  refresh: boolean;

  update: boolean;

  sub: Subscription;

  private _selectedTemplateName: string = null;
  private _selectedTemplate: TemplateRef<any>;

  constructor(
    public pagerService: PagerService,
    public changeRef: ChangeDetectorRef
  ) {
    super(pagerService, changeRef);
    this.gridReady.subscribe(x => this.onGridReady(x));
  }

  ngOnInit() {
    super.ngOnInit();

  }

  ngAfterViewInit() {
  }

  onGridReady(x: IGridEvent) {
    if (x.event === K_OPTIONS && x.api.getViewMode() === K_INFINITE) {
      this.refresh = false;
    } else if (x.event === K_INITIALIZE) {

    }
  }

  setViewMode(viewMode: string) {
    if (viewMode === K_INFINITE) {
      this.infiniteOnOff = true;
    } else {
      this.infiniteOnOff = false;
    }
    super.setViewMode(viewMode);
  }

  supportedViewModes(): IGridMode[] {
    return [
      { name: K_VIEW, label: K_VIEW },
      { name: K_PAGED, label: K_PAGED },
      { name: K_INFINITE, label: K_INFINITE }
    ];
  }


  selectedTemplate() {
    const gridMode = this.getViewMode();
    if (this._selectedTemplateName !== gridMode || !this._selectedTemplate) {
      this._selectedTemplateName = gridMode;
      if (this.sub) {
        this.sub.unsubscribe();
        this.sub = undefined;
      }
      this._selectedTemplate = this.getTemplate(gridMode);
    }
    return this._selectedTemplate;
  }

  getTemplate(templateName: string): TemplateRef<any> {
    if (this.templateRefs) {
      return this.templateRefs
        .toArray()
        .find(x => x.name.toLowerCase() === templateName.toLowerCase()).template;
    } else {
      return null;
    }
  }



  onBottomReached($event: IScrollEvent) {
    const boundries = this.getDataNodes().getFrameBoundries();
    const start = boundries.end;
    const end = start + boundries.range;

    // this.listenForRowChanges();

    this.getDataNodes().doChangeSpan(start, end).subscribe(x => {
      console.log('data fetched');
    });
    // this.getDataNodes().
  }
}
