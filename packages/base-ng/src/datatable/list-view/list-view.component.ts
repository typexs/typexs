import { ChangeDetectorRef, Component, Input, QueryList, TemplateRef, ViewChildren } from '@angular/core';
import { AbstractGridComponent } from '../api/abstract-grid.component';
import { PagerService } from '../../pager/PagerService';
import { IDatatableListGridOptions } from './IDatatableListGridOptions';
import { IGridMode, K_INFINITE, K_OPTIONS, K_PAGED, K_VIEW } from '../api/IGridMode';
import { TemplateDirective } from '../Template.directive';
import { filter } from 'rxjs/operators';
import { InfiniteScrollDirective } from '../infinite-scroll/infinite-scroll.directive';
import { IGridEvent } from '../api/IGridEvent';


@Component({
  selector: 'txs-list-view',
  templateUrl: 'list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent extends AbstractGridComponent {

  @ViewChildren(TemplateDirective)
  templateRefs: QueryList<TemplateDirective>;


  @Input()
  allowViewModeSwitch: boolean = true;

  @Input()
  viewMode: string = 'teaser';

  @Input()
  options: IDatatableListGridOptions;

  infiniteOnOff: boolean = true;

  refresh: boolean;

  private _selectedTemplateName: string = null;
  private _selectedTemplate: TemplateRef<any>;

  constructor(
    public pagerService: PagerService,
    public changeRef: ChangeDetectorRef
  ) {
    super(pagerService, changeRef);
    this.gridReady.subscribe(x => this.onGridReady(x));
  }

  // ngOnInit() {
  //   super.ngOnInit();
  //
  // }

  onGridReady(x: IGridEvent) {
    if (x.event === K_OPTIONS && x.api.getViewMode() === K_INFINITE) {
      this.refresh = false;
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
      this._selectedTemplate = this.getTemplate(gridMode);
      // this.changeRef.markForCheck();
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


  onBottomReached($event: any) {
    const boundries = this.getDataNodes().getFrameBoundries();
    console.log('asd', boundries);
    const start = boundries.end;
    const end = start + boundries.range;
    this.getDataNodes().doChangeSpan(start, end).subscribe(x => {
      console.log('fetched');
    });

    // this.getDataNodes().
  }
}
