import {Component, OnInit} from '@angular/core';
import {GroupDemoObject} from './entities/GroupDemoObject';


@Component({
  selector: 'groupDemo',
  templateUrl: 'group-demo.component.html',

})
export class GroupDemoComponent implements OnInit {

  object01: any;

  result: any;

  ngOnInit() {
    this.object01 = new GroupDemoObject();
  }


  onSubmit($event: any) {
    this.result = $event;
  }
}
