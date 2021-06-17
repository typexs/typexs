import * as d3 from 'd3';
import {get, isBoolean, isDate, isNumber, isString} from 'lodash';
import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ComponentRef,
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
import {AbstractQueryService} from '@typexs/base-ng';
import {StorageService} from '@typexs/storage-ng';
import {EntityService} from '@typexs/entity-ng';
import {IEntityRef} from '@allgemein/schema-api';
import {filter as rFilter, first as rFirst, mergeMap} from 'rxjs/operators';


class FieldRef {
  name: string;
  type: string;
  path: string;
}

const margin = {top: 10, right: 30, bottom: 30, left: 50},
  width = 660 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

/**
 * Wrapper component for different grid implementiations
 *
 * - static variant when rows are given
 */
@Component({
  selector: 'txs-dataview',
  templateUrl: 'dataview.component.html',
  styleUrls: ['./dataview.component.scss']
})
export class DataViewComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {

  @Input()
  component: any;

  @ViewChild('content', {read: ViewContainerRef, static: true})
  vc: ViewContainerRef;

  componentRef: ComponentRef<any>;

  query: AbstractQueryService;

  services: Function[] = [StorageService, EntityService];

  entities: IEntityRef[] = [];

  serviceIdx: number;

  entityIdx: number;

  entries: any[];

  filtered: any[];

  fieldRefs: FieldRef[] = [];

  svg: any;

  x: any;
  xAxis: any;

  y: any;
  yAxis: any;

  constructor(@Inject(Injector) public injector: Injector,
              @Inject(ComponentFactoryResolver) public r: ComponentFactoryResolver) {
  }

  getService(): AbstractQueryService {
    if (this.serviceIdx >= 0) {
      return this.injector.get(this.services[this.serviceIdx]);
    }
    return null;
  }

  getRegistryEntries() {
    const service = this.getService();
    if (service) {
      if (service instanceof StorageService) {
        return (<any>service.getRegistry()).getEntityRefs();
      } else {
        return (<any>service.getRegistry()).listEntities();
      }

    } else {
      return [];
    }

  }

  onServiceSelect($event: any) {
    this.entities = this.getRegistryEntries();
  }

  onEntitySelect($event: any) {
    const entityRef = this.entities[this.entityIdx];
    const service = this.getService();
    service.isReady()
      .pipe(rFilter(x => x))
      .pipe(rFirst())
      .pipe(mergeMap(x => service.query(entityRef.name, null, {limit: 10})))
      .subscribe(x => {
        if (x) {
          this.entries = x.entities;
        }
      });

  }

  add() {
    this.fieldRefs.push(new FieldRef());
  }

  update() {
    this.filtered = this.entries.map(entry => {
      const ret = {};
      for (const f of this.fieldRefs) {
        ret[f.name] = get(entry, f.path, undefined);
        if (isNumber(ret[f.name])) {
          f.type = 'number';
        } else if (isDate(ret[f.name])) {
          f.type = 'date';
        } else if (isString(ret[f.name])) {
          f.type = 'string';
        } else if (isBoolean(ret[f.name])) {
          f.type = 'boolean';
        }

      }
      return ret;
    });
    if (this.fieldRefs.length >= 2) {
      this.updateGraph(this.filtered);
    }


  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.svg = d3.select('#my_dataviz')
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')');


    // if (this.fieldRefs[0].type === 'date') {
    //   this.x = d3.scaleTime().range([0, width]);
    // } else {
    this.x = d3.scaleLinear().range([0, width]);
    // }

    // @ts-ignore
    this.xAxis = d3.axisBottom().scale(this.x);
    this.svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .attr('class', 'myXaxis');

// Initialize an Y axis
    this.y = d3.scaleLinear().range([height, 0]);
    // @ts-ignore
    this.yAxis = d3.axisLeft().scale(this.y);
    this.svg.append('g')
      .attr('class', 'myYaxis');

  }

  updateGraph(data: any) {

    const self = this;
    const fieldX = this.fieldRefs[0];
    const fieldY = this.fieldRefs[1];
    // const fieldLength = this.fieldRefs.length - 1;
    // const fieldsY: string[] = [];
    // for (let i = 1; i < fieldLength; i++) {
    //   fieldsY.push(this.fieldRefs[i].name);
    // }


    // Create the X axis:
    this.x.domain([0, d3.max(data, function (d: any) {
      return d[fieldX.name];
    })]);

    this.svg.selectAll('.myXaxis').transition()
      .duration(3000)
      .call(this.xAxis);

    // create the Y axis
    this.y.domain([0, d3.max(data, function (d: any) {
      return d[fieldY.name];
    })]);

    this.svg.selectAll('.myYaxis')
      .transition()
      .duration(3000)
      .call(this.yAxis);


    // Create a update selection: bind to the new data
    const u = this.svg.selectAll('.lineTest')
      .data([data], function (d: any) {
        return d[fieldX.name];
      });

    // Updata the line
    const x = u.enter();

    // for (const f of fieldsY) {
    x.append('path')
      .attr('class', 'lineTest')
      .merge(u)
      .transition()
      .duration(3000)
      .attr('d', d3.line()
        .x(function (d: any) {
          return self.x(d[fieldX.name]);
        })
        .y(function (d: any) {
          return self.y(d[fieldY.name]);
        }))
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2.5);
    // }

  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges) {
  }

}
