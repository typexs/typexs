import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GridFieldObject } from '../../entities/GridFieldObject';
import { IFormOptions } from '@typexs/forms/lib/IFormOptions';
import { clone, cloneDeep } from 'lodash';
import { Log } from '@typexs/base-ng';


@Component({
  selector: 'grid-fields',
  templateUrl: 'grid-fields.component.html'
})
export class GridFieldsComponent implements OnInit, OnChanges {

  object01: any;

  // result: Subject<any> = new BehaviorSubject<any>({});
  result: any;

  options: IFormOptions = {
    onlyDecoratedFields: true
  };


  ngOnInit() {
    this.object01 = new GridFieldObject();
    this.result = clone(this.object01);
  }


  ngOnChanges(changes: SimpleChanges) {
    Log.info('');
  }

  onSubmit($event: any) {
    this.result = cloneDeep($event.data.instance); // = ;
  }


}
