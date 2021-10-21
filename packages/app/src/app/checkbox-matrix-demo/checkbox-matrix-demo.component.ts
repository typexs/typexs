import {Component, OnInit} from '@angular/core';
import {CheckboxMatrixRow} from './../entities/CheckboxMatrixRow';
import {CheckboxMatrix} from './../entities/CheckboxMatrix';


@Component({
  templateUrl: './checkbox-matrix-demo.component.html',
})
export class CheckboxMatrixDemoComponent implements OnInit {

  checkboxMatrix: CheckboxMatrix;

  result: any;

  ngOnInit(): void {
    this.checkboxMatrix = new CheckboxMatrix();
    this.checkboxMatrix.rows = [];

    const row = new CheckboxMatrixRow();
    row.label = 'allow all';
    row.roles = ['admin'];
    this.checkboxMatrix.rows.push(row);

    const row2 = new CheckboxMatrixRow();
    row2.label = 'deny all';
    row2.roles = ['user'];
    this.checkboxMatrix.rows.push(row2);
  }

  onSubmit($event: any) {
    this.result = $event;
  }
}
