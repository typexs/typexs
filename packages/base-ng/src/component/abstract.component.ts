import { Component, ComponentFactoryResolver, Inject, Injector, ViewChild, ViewContainerRef } from '@angular/core';
import { ComponentRegistryService } from './component-registry.service';

@Component({
  template: ''
})
export class AbstractComponent {

  @ViewChild('content', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver
  ) {
    this.construct();
  }

  /**
   * Overridable helper method called by constructor
   */
  construct() {
  }


  getViewContainerRef(): ViewContainerRef {
    return this.vc;
  }

  getComponentRegistry(): ComponentRegistryService {
    return this.injector.get(ComponentRegistryService);
  }


  reset() {
    if (this.getViewContainerRef()) {
      this.getViewContainerRef().clear();
    }
  }

}
