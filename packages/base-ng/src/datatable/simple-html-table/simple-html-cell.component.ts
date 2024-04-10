import {
  Component,
  ComponentFactoryResolver,
  ComponentRef, HostListener,
  Inject,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { IGridColumn } from '../api/IGridColumn';
import { CC_GRID_CELL_VALUE, SIMPLE_TABLE } from '../../constants';
import { ComponentRegistryService } from '../../component/component-registry.service';
import { ISimpleTable } from './ISimpleTable';
import { Node } from '../../lib/datanodes/Node';


@Component({
  selector: 'txs-simple-html-cell',
  templateUrl: 'simple-html-cell.component.html'
})
export class SimpleHtmlCellComponent implements OnInit, OnDestroy {


  @Input()
  column: IGridColumn;

  @Input()
  row: Node<any>;

  @Input()
  parent: ISimpleTable;


  @ViewChild('cell', { read: ViewContainerRef, static: true })
  vc: ViewContainerRef;

  ref: ComponentRef<any>;

  constructor(
    @Inject(Injector) public injector: Injector,
    @Inject(ComponentRegistryService) public config: ComponentRegistryService,
    @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
  }


  ngOnInit() {
    let ccName: string;
    if (this.column.cellValueRenderer) {
      ccName = this.column.cellValueRenderer;
    } else {
      ccName = CC_GRID_CELL_VALUE;
    }
    let cClass = this.config.getComponentClass(SIMPLE_TABLE, ccName);
    if (!cClass) {
      cClass = this.config.getComponentClass(SIMPLE_TABLE, CC_GRID_CELL_VALUE);
    }

    if (!cClass) {
      throw new Error('Class ' + ccName + ' not found.');
    }

    const factory = this.r.resolveComponentFactory(cClass);
    this.ref = this.vc.createComponent(factory);
    this.ref.instance.column = this.column;
    this.ref.instance.row = this.row;
    this.ref.changeDetectorRef.detectChanges();
  }


  ngOnDestroy(): void {
    if (this.ref) {
      this.ref.destroy();
    }

  }


}
