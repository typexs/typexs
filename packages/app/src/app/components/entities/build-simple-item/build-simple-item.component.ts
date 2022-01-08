import {Component} from '@angular/core';
import {IInstanceableComponent} from '@typexs/base-ng';
import { BuildSimpleItem } from '../../../../../../../demo/testtask/entities/BuildSimpleItem';


@Component({
  selector: 'app-build-simple-item',
  templateUrl: 'build-simple-item.component.html',
  styleUrls: ['./build-simple-item.component.scss']

})
export class BuildSimpleItemComponent implements IInstanceableComponent<BuildSimpleItem> {

  instance: BuildSimpleItem;

  viewMode: string;

  static supportedViewModes() {
    return ['teaser', 'full'];
  }

  label(){
    return this.instance.name + ' - ' +this.instance.id;
  }

  getViewContext(): string {
    return this.viewMode;
  }

  setViewContext(context: string) {
    this.viewMode = context;
  }

  getInstance(): any {
    return this.instance;
  }

  setInstance(instance: BuildSimpleItem) {
    this.instance = instance;
  }
}
