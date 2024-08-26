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
import { BehaviorSubject, Observable } from 'rxjs';
import { IGridEvent } from './api/IGridEvent';
import { ViewArray } from '../lib/datanodes/ViewArray';


const K_COMP = 'component';

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
   * Cache initial set values, this is necessary for initialization
   * over a datatable.
   *
   * @private
   */
  protected _initCache: any = {};

  /**
   * The wrapped grid component which is used for the display
   */
  @Input()
  component: ClassType<AbstractGridComponent>;


  @ViewChild('content', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  componentRef: ComponentRef<AbstractGridComponent>;

  get maxRows() {
    return this._initCache['maxRows'];
  }

  set maxRows(rows: number) {
    this._initCache['maxRows'] = rows;
  }

  get limit() {
    return this._initCache['limit'];
  }

  set limit(limit: number) {
    this._initCache['limit'] = limit;
  }

  get rows() {
    return this._initCache['rows'];
  }

  set rows(rows: any[]) {
    this._initCache['rows'] = rows;
  }

  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver,
    @Inject(ComponentRegistryService) public componentRegistryService: ComponentRegistryService,
    @Inject(PagerService) public pagerService: PagerService,
    @Inject(ChangeDetectorRef) public changeRef: ChangeDetectorRef
  ) {
    super(pagerService, changeRef);
  }


  ngOnInit(): void {
    // super.ngOnInit();
    if (!this.component) {
      this.component = this.detectDefaultGridComponent();
    }
    this.options = this.options || {};
    this.applyLayout(this.component);
  }

  /**
   * Disable initializations
   */
  ngAfterViewInit() {
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


  getGridComponent() {
    return this.ref().instance;
  }

  /**
   * Data nodes should be the same object as embedded.
   * It is referred from remove object.
   */
  getNodes(): ViewArray<any> {
    return super.getNodes();
  }

  setNodeData(nodes: any[]) {
    this.getGridComponent().setNodeData(nodes);
  }

  getControl(): BehaviorSubject<IGridEvent> {
    return this.getGridComponent().getControl();
  }

  getControlObserver(): Observable<IGridEvent> {
    return super.getControlObserver();
  }

  /**
   * Pass changes
   *
   * @param changes
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes[K_COMP]) {
      if (changes[K_COMP].currentValue && !changes[K_COMP].firstChange) {
        this.applyLayout(changes[K_COMP].currentValue);
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
      }
    }
  }

  getInputPropertyNames() {
    let add = [].concat(inputKeys);
    if (this.options && this.options.passInputs) {
      add.push(...this.options.passInputs);
    }
    return uniq(add);
  }

  /**
   *
   * @param component
   */
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
    const passInputs = this.getInputPropertyNames();
    const passOutputs = uniq([].concat((this.options.passOutputs || []), outputKeys));
    const passMethods = uniq([].concat((this.options.passMethods || []), methodKeys));

    // TODO how to pass passing through input parameters
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const instance = this.getGridComponent();
    for (const prop of passInputs) {
      // const propDesc = Object.getOwnPropertyDescriptor(this, prop);
      // if (propDesc) {
      if (!['rows', 'limit', 'maxRows', 'offset'].includes(prop)) {
        this._initCache[prop] = this[prop];
      }
      // wrap properties to instance
      Object.defineProperty(self, prop, {
        get(): any {
          return instance[prop];
        },
        set(v: any) {
          instance[prop] = v;
        },
        configurable: true,
        enumerable: true
      });
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

    this.initCacheIfSet();

    // run ngOnInit and ngAfterViewInit if present
    this.ref().changeDetectorRef.detectChanges();
  }

  /**
   * Initialized cached rows
   * @private
   */
  private initCacheIfSet() {true
    const initCache = this._initCache;
    const passInputs = this.getInputPropertyNames();
    // keep order _dataNodes must be first
    for (const input of passInputs) {
      this.setCached(input);
    }
    // rest open
    for (const key in initCache) {
      this.setCached(key);
    }
  }

  setCached(key: string) {
    if (typeof this[key] === 'function') {
      this[key](this._initCache[key]);
    } else {
      this[key] = this._initCache[key];
    }
    delete this._initCache[key];
  }


  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }
}
