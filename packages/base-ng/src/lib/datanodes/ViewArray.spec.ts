import { ViewArray } from '@typexs/base-ng/lib/datanodes/ViewArray';
import { range } from 'lodash';

describe('ViewArray', () => {


  // TODO empty array
  it('iterate over range iterator', async () => {
    const v1 = { value: 1 };
    const v2 = { value: 2 };
    const nodes = new ViewArray();
    nodes.push(v1, v2);
    expect(nodes.isDirty()).toBeFalse();
    const data = [];
    const values: any[] = await new Promise((resolve, reject) => {
      nodes.getValues().subscribe(x => {
        resolve(x);
      }, error => {
        console.error(error);
      });
    });
    for (const entry of values) {
      data.push(entry);
    }
    expect(data.length).toEqual(nodes.length);
    expect(data).toEqual([v1, v2]);
  });

  it('iterate over range iterator with limit', async () => {
    const values = range(1, 10).map(x => ({ value: x }));
    const nodes = new ViewArray();
    nodes.limit = 5;
    nodes.push(...values);
    const data = [];
    const _values: any[] = await new Promise((resolve, reject) => {
      nodes.getValues().subscribe(x => {
        resolve(x);
      }, error => {
        console.error(error);
      });
    });
    for (const entry of _values) {
      data.push(entry);
    }
    expect(data.length).toEqual(nodes.limit);
    expect(data).toEqual(values.filter((value, index) => index < nodes.limit));
  });


  it('iterate over range iterator with limit and offset', async () => {
    const values = range(1, 10).map(x => ({ value: x }));
    const nodes = new ViewArray();
    nodes.viewStartIdx = 4;
    nodes.limit = 5;
    nodes.push(...values);
    const _values: any[] = await new Promise((resolve, reject) => {
      nodes.getValues().subscribe(x => {
        resolve(x);
      }, error => {
        console.error(error);
      });
    });
    const data = [];
    for (const entry of _values) {
      data.push(entry);
    }
    expect(data.length).toEqual(nodes.limit);
    const res = values.filter((value, index) => index >= nodes.viewStartIdx);
    expect(data).toEqual(res);
  });

});
