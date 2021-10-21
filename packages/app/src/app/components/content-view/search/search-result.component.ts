import {Component, ComponentFactoryResolver, Inject, Injector} from '@angular/core';
import {ViewContent} from '@typexs/ng';
import {TreeObject} from '@typexs/ng';
import {ViewComponent} from '@typexs/ng';
import {AbstractComponent} from '@typexs/base-ng';


@ViewContent('search-result')
export class SearchResult extends TreeObject {
  type = 'search-result';
}

@ViewComponent('search-result')
@Component({
  selector: 'search-result',
  templateUrl: 'search-result.component.html',

})
export class SearchResultComponent extends AbstractComponent<SearchResult> {


  title = 'SuperSearch';

  constructor(@Inject(Injector) public injector: Injector,
              @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
    super(injector, r);
  }

}
