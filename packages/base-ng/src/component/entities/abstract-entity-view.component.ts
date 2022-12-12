import { get, has, isUndefined } from 'lodash';
import { Component, Inject, Input } from '@angular/core';
import { IInstanceableComponent } from '../IInstanceableComponent';
import { EntityResolverService } from '../../services/entity-resolver.service';
import { IQueringService } from '../../api/querying/IQueringService';
import { IEntityViewOptions } from './IEntityViewOptions';
import { ComponentRegistry } from '@typexs/base';
import { IEntityResolveOptions } from '../../services/IEntityResolveOptions';
import { Log } from '../../lib/log/Log';

@Component({
  template: ''
})
export class AbstractEntityViewComponent<T> implements IInstanceableComponent<T> {

  private _label: string;

  private _url: string;

  @Input()
  instance: T;

  @Input()
  options: IEntityViewOptions;

  viewContext: string;

  loading: boolean = false;

  get resolverOptions(): IEntityResolveOptions {
    return get(this.options, 'resolver', {
      idKeys: [{ key: '_id', optional: true }]
    });
  }

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
    const entityRef = this.resolverService.getEntityRef(this.getInstance(), this.resolverOptions);
    const id = this.resolverService.getIdKeysFor(this.getInstance(), this.resolverOptions);
    this.getService().get(entityRef.name, id, get(this.options, 'req', {})).subscribe(x => {
      this.instance = x;
    }, error => {
    }, () => {
      this.loading = false;
    });
  }

  type() {
    const obj = this.resolverService.getEntityRef(this.getInstance(), this.resolverOptions);
    if (obj) {
      return obj.name;
    }
    return ComponentRegistry.getClassName(<any>this.getInstance());
  }

  url() {
    if (isUndefined(this._url)) {
      try {
        this._url = this.resolverService.getRouteFor(this.getInstance(), this.resolverOptions);
      } catch (e) {
        Log.error(e);
      }
    }
    return this._url;
  }

  label() {
    if (isUndefined(this._label)) {
      try {
        this._label = this.resolverService.getLabelFor(this.getInstance(), this.resolverOptions);
      } catch (e) {
        Log.error(e);
      }
    }
    return this._label;
  }

  getService(): IQueringService {
    return this.resolverService.getServiceFor(this.getInstance(), this.resolverOptions);
  }
}
