import { Component, OnInit } from '@angular/core';
import { GroupDemoObject } from '../../entities/GroupDemoObject';
import { IFormOptions } from '@typexs/forms/lib/IFormOptions';


@Component({
  selector: 'groupDemo',
  templateUrl: 'group-demo.component.html'

})
export class GroupDemoComponent implements OnInit {

  object01: any;

  result: any;

  options: IFormOptions = {
    onlyDecoratedFields: true
  };

  ngOnInit() {
    this.object01 = new GroupDemoObject();
  }


  onSubmit($event: any) {
    this.result = $event;
  }
}
