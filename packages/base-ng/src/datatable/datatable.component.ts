import { get, keys, uniq } from 'lodash';
import {
  ChangeDetectorRef,
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
import { AbstractGridComponent } from './api/abstract-grid.component';
import { ComponentRegistryService } from '../component/component-registry.service';
import { Log } from '../lib/log/Log';
import { ClassType, inputKeys, methodKeys, outputKeys } from './Constants';
import { PagerService } from '../pager/PagerService';

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

  /**
   * The wrapped grid component which is used for the display
   */
  @Input()
  component: ClassType<AbstractGridComponent>;


  @ViewChild('content', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  componentRef: ComponentRef<AbstractGridComponent>;


  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver,
    @Inject(ComponentRegistryService) public componentRegistryService: ComponentRegistryService,
    @Inject(PagerService) public pagerService: PagerService,
    @Inject(ChangeDetectorRef) public changeRef: ChangeDetectorRef) {
    super(pagerService, changeRef);
  }


  ngOnInit(): void {
    // super.ngOnInit();

    if (!this.component) {
      this.component = this.detectDefaultGridComponent();
    }
    this.applyLayout(this.component);
  }

  detectDefaultGridComponent() {
    const binding = this.componentRegistryService
      .registry.find(x =>
        x.component &&
        get(x, 'extra.datatable', false) &&
        get(x, 'extra.default', false));
    if (!binding) {
      throw new Error('can\'t find default grid component');
    }
    Log.debug('Select default grid component ' + binding.key);
    return binding.component as ClassType<AbstractGridComponent>;
  }

  ref() {
    return this.componentRef;
  }

  // api() {
  //   return this.ref().instance;
  // }


  getGridComponent() {
    return this.ref().instance;
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
      if (this.ref() && this.getGridComponent()) {
        const instance = this.getGridComponent();
        for (const key of keys(changes)) {
          instance[key] = changes[key].currentValue;
          if (instance[key + 'Change'] && instance[key + 'Change'] instanceof EventEmitter) {
            instance[key + 'Change'].emit(changes[key].currentValue);
          }
        }
        // this.rebuild();
      }
    }
  }

  applyLayout(component: ClassType<AbstractGridComponent>) {
    this.vc.clear();
    this.component = component;
    const factory = this.r.resolveComponentFactory(this.component);
    this.componentRef = this.vc.createComponent(factory);

    if (!(this.componentRef.instance instanceof AbstractGridComponent)) {
      throw new Error('Component instance is not inherited from AbstractGridComponent');
    }

    // refer to parent
    this.componentRef.instance.parent = this;


    // apply default annotation pass
    const passInputs = uniq([].concat((this.options.passInputs || []), inputKeys));
    const passOutputs = uniq([].concat((this.options.passOutputs || []), outputKeys));
    const passMethods = uniq([].concat((this.options.passMethods || []), methodKeys));


    // TODO how to pass passing through input parameters
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const instance = this.getGridComponent();
    for (const prop of passInputs) {
      if (typeof this[prop] !== 'undefined') {
        // this.instance[prop] = this[prop];
        Object.defineProperty(instance, prop, {
          get(): any {
            return self[prop];
          },
          set(v: any) {
            self[prop] = v;
          },
          configurable: true,
          enumerable: true
        });
      }
      // try {
      //   const propDesc = Object.getOwnPropertyDescriptor(this, prop);
      //   if (propDesc) {
      //     // copy only if exists
      //     Object.defineProperty(this.instance, prop, propDesc);
      //   }
      // } catch (e) {
      // }
    }

    // passing through output eventemitter
    for (const prop of passOutputs) {
      if (instance[prop] && instance[prop] instanceof EventEmitter) {
        (<EventEmitter<any>>instance[prop]).subscribe(
          (v: any) => (<EventEmitter<any>>this[prop]).emit(v),
          (error: any) => (<EventEmitter<any>>this[prop]).error(error),
          () => (<EventEmitter<any>>this[prop]).complete()
        );
      }
    }

    // override passMethods
    for (const method of passMethods) {
      if (instance[method]) {
        this[method] = instance[method].bind(instance);
      }
    }

    // run ngOnInit if present
    this.ref().changeDetectorRef.detectChanges();
    this.emitEvent('initialized');
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
