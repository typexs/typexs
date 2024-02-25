import { ViewArray } from '@typexs/base-ng/lib/datanodes/ViewArray';
import { range } from 'lodash';
import { Observable, of } from 'rxjs';

describe('ViewArray', () => {
  let nodes: ViewArray<any>;

  beforeEach(() => {
    nodes = new ViewArray();
  });

  /**
   * Check setting values by apply method
   */
  it('apply fetch data on begin of array', () => {
    // add single node
    nodes.applyFetchData(0, range(0, 1).map(x => ({ idx: x, name: 'T ' + x })));
    expect(nodes).toHaveSize(1);
    expect(nodes.asArray()).toEqual([{
      'idx': 0,
      'name': 'T 0'
    }]);
  });

  /**
   * Check setting values by apply method
   */
  it('apply fetch data on further part of array', () => {
    // add single node
    nodes.applyFetchData(10, range(0, 1).map(x => ({ idx: x, name: 'T ' + x })));
    expect(nodes).toHaveSize(11);
    expect(nodes.asArray()).toEqual([
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
        'idx': 0,
        'name': 'T 0'
      }]);
  });


  /**
   * Check undefined value detection
   */
  it('check if undefined values are found', () => {
    // add single node
    nodes[19] = undefined;
    expect(nodes).toHaveSize(20);

    expect(nodes.checkForUndefined(0, 10)).toEqual(10);
    expect(nodes.checkForUndefined(0, 100)).toEqual(20);
    expect(nodes.checkForUndefined(18, 100)).toEqual(2);
    expect(nodes.checkForUndefined(19, 100)).toEqual(1);
    expect(nodes.checkForUndefined(20, 100)).toEqual(-1);

    expect(nodes.checkForUndefined(-1, 10, 'backward')).toEqual(-1);
    expect(nodes.checkForUndefined(0, 10, 'backward')).toEqual(1);
    expect(nodes.checkForUndefined(9, 100, 'backward')).toEqual(10);
    expect(nodes.checkForUndefined(9, 10, 'backward')).toEqual(10);
    expect(nodes.checkForUndefined(4, 10, 'backward')).toEqual(5);
    // expect(nodes.checkForUndefined(0,100)).toEqual(20);
  });


  describe('fetch data by callback', () => {

    /**
     * Fetch initial data
     */
    it('initial data', async () => {
      const data = range(0, 10)
        .map(r => ({
          idx: r,
          name: '' + r
        }));
      nodes.maxRows = 100;
      nodes.setNodeCallback((startIdx: number, endIdx: number) =>
        of(data)
      );
      // spyOn(nodes, 'applyFetchData');
      // nodes.calcViewFrame();
      nodes.fetch(0, 10);
      await new Promise((resolve, reject) => setTimeout(resolve, 500));
      // expect(nodes.applyFetchData).toHaveBeenCalled();
      expect(nodes).toHaveSize(10);
      expect(nodes.asArray()).toEqual(data);
    });


    /**
     * Fetch following
     */
    it('next data', async () => {
      const data = range(0, 10)
        .map(r => ({
          idx: r,
          name: '' + r
        }));
      nodes.maxRows = 100;
      nodes.setNodeCallback((startIdx: number, endIdx: number) => of(data));
      nodes.fetch(10, 10);
      await new Promise((resolve, reject) => setTimeout(resolve, 500));
      expect(nodes).toHaveSize(20);
      expect(nodes.asArray()).toEqual([].concat(range(10).map(() => undefined), data));
    });
  });


  /**
   * Reset of array
   */
  it('reset of array', () => {
    nodes.push(1, 2, 3, 4);
    expect(nodes).toHaveSize(4);
    expect(nodes).toHaveSize(4);
    nodes.reset();
    expect(nodes).toHaveSize(0);
    nodes.applyFetchData(100, [1, 2, 3, 4]);
    expect(nodes).toHaveSize(104);
    nodes.reset();
    expect(nodes).toHaveSize(0);
  });


  /**
   * Next view calculation
   */
  it('next view calculation', () => {
    nodes.limit = 10;
    nodes.push(...range(0, 200));
    nodes.nextView();
    let next = nodes.getValues().getValue();
    expect(next).toHaveSize(10);
    expect(next).toEqual(range(0, 10));
    nodes.nextView();
    next = nodes.getValues().getValue();
    expect(next).toHaveSize(10);
    expect(next).toEqual(range(10, 20));
  });

  /**
   * Previous view calculation
   */
  it('previous view calculation', () => {
    nodes.limit = 10;
    nodes.push(...range(0, 200));
    nodes.setView(100, 110);
    nodes.previousView();
    let next = nodes.getValues().getValue();
    expect(next).toHaveSize(10);
    expect(next).toEqual(range(90, 100));
    nodes.previousView();
    next = nodes.getValues().getValue();
    expect(next).toHaveSize(10);
    expect(next).toEqual(range(80, 90));
  });


  /**
   *
   */
  it('iterate over range iterator', async () => {
    const v1 = { value: 1 };
    const v2 = { value: 2 };
    const nodes = new ViewArray();
    nodes.push(v1, v2);
    nodes.nextView();
    // expect(nodes.isDirty()).toBeFalse();
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
    nodes.push(...values);
    nodes.setView(0, null, 5);
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

  /**
   * Get values of current frame with limit and offset
   */
  it('get values of current frame with limit and offset', async () => {
    const values = range(1, 10).map(x => ({ value: x }));
    nodes.push(...values);
    nodes.setView(4, null, 5);
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
    const res = values.filter((value, index) => index >= nodes.startIdx);
    expect(data).toEqual(res);
  });


});
