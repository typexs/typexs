import {AfterViewInit, Component, ComponentFactoryResolver, Inject, Injector, OnInit, ViewChild} from '@angular/core';
import {SearchEntryComponent} from './search-entry.component';
import {TreeObject, ViewComponent, ViewContent} from '@typexs/ng';
import {AbstractComponent} from '@typexs/base-ng';


@ViewContent('view-parent')
export class ViewParent extends TreeObject {
  type = 'view-parent';
}


@ViewComponent('view-parent')
@Component({
  selector: 'view-parent',
  templateUrl: 'view-parent.component.html',
})
export class ViewParentComponent extends AbstractComponent<ViewParent> implements AfterViewInit, OnInit {

  @ViewChild(SearchEntryComponent, {static: true})
  searchEntry: SearchEntryComponent;

  searchEntry2: SearchEntryComponent;

  title = 'ViewParent';


  constructor(@Inject(Injector) public injector: Injector,
              @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
    super(injector, r);
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
  }


}
