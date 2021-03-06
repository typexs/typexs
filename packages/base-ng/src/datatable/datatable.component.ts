import { defaults, get, keys, uniq } from 'lodash';
import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  EventEmitter,
  Inject,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { AbstractGridComponent } from './abstract-grid.component';
import { ComponentRegistryService } from '../component/component-registry.service';
import { Log } from '../lib/log/Log';
import { IDatatableOptions } from './IDatatableOptions';
import { inputKeys, K_PAGED, methodKeys, outputKeys } from './Constants';

/**
 * Wrapper component for different grid implementiations
 *
 * - static variant when rows are given
 */
@Component({
  selector: 'txs-datatable',
  templateUrl: 'datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent extends AbstractGridComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  component: any;

  // Used in abstract grid
  // @Input()
  // options: IDatatableOptions;

  @ViewChild('content', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  componentRef: ComponentRef<any>;


  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver,
    @Inject(ComponentRegistryService) public componentRegistryService: ComponentRegistryService) {
    super();
  }


  ngOnInit(): void {
    this.options = this.options || {};
    defaults(this.options, <IDatatableOptions>{
      mode: K_PAGED,
      passInputs: [],
      passOutputs: [],
      passMethods: []
    });

    // apply default annotation pass
    this.options.passInputs.push(...inputKeys);
    this.options.passOutputs.push(...outputKeys);
    this.options.passMethods.push(...methodKeys);
    uniq(this.options.passInputs);
    uniq(this.options.passOutputs);
    uniq(this.options.passMethods);

    if (!this.component) {
      const binding = this.componentRegistryService.registry.find(x =>
        x.component &&
        get(x, 'extra.datatable', false) &&
        get(x, 'extra.default', false));
      if (!binding) {
        throw new Error('can\'t find default grid component');
      }
      Log.debug('Select default grid component ' + binding.key);
      this.component = binding.component;
    }
    this.applyLayout(this.component);
  }


  api() {
    return this.componentRef.instance;
  }

  /**
   * Pass changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      if (changes['component'].currentValue && !changes['component'].firstChange) {
        this.applyLayout(changes['component'].currentValue);
        this.rebuild();
      }
    } else {
      if (this.componentRef && this.componentRef.instance) {
        for (const key of keys(changes)) {
          this.componentRef.instance[key] = changes[key].currentValue;
          if (this.componentRef.instance[key + 'Change']) {
            this.componentRef.instance[key + 'Change'].emit(changes[key].currentValue);
          }
        }
        this.rebuild();
      }
    }
  }

  applyLayout(component: any) {
    this.vc.clear();
    this.component = component;
    const factory = this.r.resolveComponentFactory(<any>this.component);
    this.componentRef = this.vc.createComponent(factory);


    // passing through input parameters
    for (const prop of this.options.passInputs) {
      // instance[prop] = this[prop];
      try {
        const propDesc = Object.getOwnPropertyDescriptor(this, prop);
        if (propDesc) {
          // copy only if exists
          Object.defineProperty(this.api(), prop, propDesc);
        }
      } catch (e) {

      }
    }
    // passing through output eventemitter
    for (const prop of this.options.passOutputs) {
      (<EventEmitter<any>>this.api()[prop]).subscribe(
        (v: any) => (<EventEmitter<any>>this[prop]).emit(v),
        (error: any) => (<EventEmitter<any>>this[prop]).error(error),
        () => (<EventEmitter<any>>this[prop]).complete()
      );
    }

    for (const method of this.options.passMethods) {
      if (this.api()[method]) {
        this[method] = this.api()[method].bind(this.api());
      }
    }
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }

  }
}
