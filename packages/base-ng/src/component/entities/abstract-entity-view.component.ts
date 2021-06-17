import {get, has} from 'lodash';
import {Component, Inject, Input} from '@angular/core';
import {IInstanceableComponent} from '../IInstanceableComponent';
import {EntityResolverService} from '../../services/entity-resolver.service';
import {IQueringService} from '../../api/querying/IQueringService';
import {IEntityViewOptions} from './IEntityViewOptions';
import {ComponentRegistry} from '@typexs/ng';

@Component({
  template: ''
})
export class AbstractEntityViewComponent<T> implements IInstanceableComponent<T> {

  @Input()
  instance: T;

  @Input()
  options: IEntityViewOptions = {};

  viewContext: string;

  loading: boolean = false;

  constructor(@Inject(EntityResolverService) public resolverService: EntityResolverService) {
  }

  getInstance(): T {
    return this.instance;
  }

  setInstance(instance: T) {
    this.instance = instance;
  }

  getViewContext(): string {
    return this.viewContext;
  }

  setViewContext(context: string) {
    this.viewContext = context;
  }


  hasOption(path: string) {
    return has(this.options, path);
  }

  getOption(path: string, fallback: any = null) {
    return get(this.options, path, fallback);
  }

  isLoaded() {
    return !!this.instance;
  }

  reload() {
    this.loading = true;
    const entityRef = this.resolverService.getEntityRef(this.getInstance());
    const id = this.resolverService.getIdKeysFor(this.getInstance());
    this.getService().get(entityRef.name, id, get(this.options, 'req', {})).subscribe(x => {
      this.instance = x;
    }, error => {
    }, () => {
      this.loading = false;
    });
  }

  type() {
    const obj = this.resolverService.getEntityRef(this.getInstance());
    if (obj) {
      return obj.name;
    }
    return ComponentRegistry.getClassName(<any>this.getInstance());
  }

  url() {
    return this.resolverService.getRouteFor(this.getInstance());
  }

  label() {
    return this.resolverService.getLabelFor(this.getInstance());
  }

  getService(): IQueringService {
    return this.resolverService.getServiceFor(this.getInstance());
  }
}
