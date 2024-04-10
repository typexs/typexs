import { ViewArray } from '@typexs/base-ng/lib/datanodes/ViewArray';
import { range } from 'lodash';
import { Observable, of } from 'rxjs';
import {
  K_DATA_UPDATE,
  K_FRAME_UPDATE,
  K_FRAMED,
  K_INITIAL,
  K_RESET,
  K_TOP_FIXED,
  T_VIEW_ARRAY_STATES
} from '@typexs/base-ng/lib/datanodes/Constants';
import { XS_P_$COUNT } from '@typexs/base';
import { K_INFINITE, K_PAGED } from '@typexs/base-ng/datatable/api/IGridMode';
import { fakeAsync } from '@angular/core/testing';
import { first, take } from 'rxjs/operators';

function genData(s: number, e: number) {
  return range(s, e).map(x => ({ idx: x, name: 'T ' + x }));
}

function waitForObs(obs: Observable<any>): Promise<any[]> {
  return new Promise((resolve, reject) => {
    obs.subscribe((value: any[]) => {
      resolve(value);
    }, error => reject(error));
  });
}

/**
 *
 */
describe('ViewArray', () => {
  let nodes: ViewArray<any>;

  beforeEach(() => {
    nodes = new ViewArray();
  });


  /**
   * Add data manuell
   */
  it('add data to the end manually', () => {
    const data = genData(0, 1);
    nodes.push(...data);
    // // add single node
    // nodes.applyFetchData(0, range(0, 1).map(x => ({ idx: x, name: 'T ' + x })));
    expect(nodes).toHaveSize(1);
    const arr = nodes.asArray();
    expect(arr).toEqual(genData(0, 1));
  });


  /**
   * check state initial when state is changed
   */
  it('check state initialize on construct', fakeAsync(() => {
    // nodes = new ViewArray<any>();
    let state = null;
    nodes.getState().pipe(first()).subscribe(x => {
      state = x;
    });
    expect(state).toEqual(K_INITIAL);
  }));

  /**
   * check state initial when data is reseted
   */
  it('check state on reset', fakeAsync(() => {
    // nodes = new ViewArray<any>();
    const state: T_VIEW_ARRAY_STATES[] = [];
    const sub = nodes.getState().subscribe(x => {
      state.push(x);
    });
    nodes.push({ name: 'Test' });
    nodes.reset();
    sub.unsubscribe();
    expect(state).toEqual([
      K_INITIAL,
      K_DATA_UPDATE,
      K_RESET,
      K_INITIAL
    ]);
  }));

  /**
   * check state when data added
   */
  it('check state when data added', fakeAsync(() => {
    // nodes = new ViewArray<any>();
    nodes.push({ name: 'Test' });
    let state = null;
    nodes.getState().pipe(first()).subscribe(x => {
      state = x;
    });
    expect(state).toEqual(K_DATA_UPDATE);
  }));


  /**
   * check state when frame change
   */
  it('check when frame change', fakeAsync(() => {
    // nodes = new ViewArray<any>();
    nodes.push({ name: 'Test' });
    nodes.setCurrentPage(1);
    let state = null;
    nodes.getState().pipe(first()).subscribe(x => {
      state = x;
    });
    expect(state).toEqual(K_FRAME_UPDATE);
  }));

  /**
   * TODO: insert data on specific position manually
   */
  // it('insert data on specific position manually', () => {
  // });

  /**
   * TODO: remove data manuell
   */
  // it('remove data manuell', () => {
  // });

  /**
   * Tests for infinite mode
   */
  describe('in infinite mode with callback', () => {

    /**
     * Define mode and callback for data retrieval
     */
    beforeEach(() => {
      nodes.setFrameMode(K_INFINITE);
      nodes.setNodeCallback((startIdx, endIdx) => of(genData(startIdx, endIdx + 1)));
    });

    /**
     * Load initial nodes
     */
    it('load initial nodes', async () => {
      const obs = nodes.doChangeSpan(0, 24);
      const res = await waitForObs(obs);
      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 0, end: 24, range: 25 });
      const data = genData(0, 25);
      expect(res.map(x => x.data)).toEqual(data);
      expect(nodes.getLoadedAsArray().map(x => x.data)).toEqual(data);
    });

    /**
     * Load nodes in infinite mode
     */
    it('load nodes parallel', async () => {
      const startIdxs = range(0, 200, 20);

      const promise = [];
      while (startIdxs.length > 0) {
        const s = startIdxs.shift();
        const obs = nodes.doChangeSpan(s, s + 25 - 1);
        promise.push(waitForObs(obs));
      }

      await Promise.all(promise);

      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 180, end: 204, range: 25 });

      const loaded = nodes.getLoadBoundries();
      expect(loaded).toEqual({ start: 0, end: 204, range: 25 });

      const data = nodes.getLoadedAsArray();
      expect(data).toHaveSize(205);
      expect(data.map(x => x.data)).toEqual(genData(0, 205));
    });

  });


  /**
   * Tests for framed mode
   */
  describe('in paged mode with callback', () => {

    beforeEach(() => {
      nodes.setFrameMode(K_PAGED);
      nodes.setNodeCallback((startIdx, endIdx) => of(genData(startIdx, endIdx + 1)));
    });


    /**
     * Check if frame data is missing and reload missing values
     */
    it('check if frame data missing', async () => {
      const data = genData(0, 1);
      nodes.setCacheLimit(10);
      nodes.push(...data);
      let ready = nodes.isFrameReady();
      expect(ready).toBeTrue();
      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 0, end: 0, range: 25 });
      const obs = nodes.doFrameReload();
      const res = await waitForObs(obs);
      ready = nodes.isFrameReady();
      expect(ready).toBeTrue();
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 0, range: 25 });
    });


    /**
     * Load data by page selection
     */
    it('pull next data and load missing', async () => {
      nodes.setCacheLimit(10);
      let ready = nodes.isFrameReady();
      expect(ready).toBeFalse();
      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 0, end: 0, range: 25 });
      let obs = nodes.doFrameReload();
      let res = await waitForObs(obs);
      ready = nodes.isFrameReady();
      expect(ready).toBeTrue();
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 0, range: 25 });

      let page = nodes.getCurrentPage();
      expect(page).toEqual(1);
      obs = nodes.doFetchFrameByPage(page + 1);
      res = await waitForObs(obs);

      page = nodes.getCurrentPage();
      expect(page).toEqual(2);
      ready = nodes.isFrameReady();
      expect(ready).toBeTrue();

      const arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toHaveSize(nodes.getFrameBoundries().range);
      expect(arr).toEqual(genData(25, 50));
    });


    /**
     * Preload data defined by prefetchLimit
     */
    it('load eager coming data and change next', async () => {
      nodes.setPrefetchLimit(100);
      nodes.setCacheLimit(100);
      const obs = nodes.doPreload();
      const res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 99, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 0, range: 25 });

      let okay = nodes.setCurrentPage(1);
      expect(nodes.isFrameReady()).toBeTrue();
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      let arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toEqual(genData(0, 25));

      okay = nodes.setCurrentPage(2);
      expect(nodes.isFrameReady()).toBeTrue();
      expect(nodes.getFrameBoundries()).toEqual({ start: 25, end: 49, range: 25 });
      arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toEqual(genData(25, 50));
    });


    /**
     * Change page process forward with preload
     */
    it('execute page change with preload forward', async () => {
      nodes.setPrefetchLimit(100);
      let obs = nodes.doChangePage(1);
      let res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 124, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(0, 25));

      obs = nodes.doChangePage(2);
      res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 149, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 25, end: 49, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(25, 50));
    });


    /**
     * Change page process forward without preload
     */
    it('execute page change without preload forward', async () => {
      nodes.setPrefetchLimit(0);
      let obs = nodes.doChangePage(1);
      let res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(0, 25));

      obs = nodes.doChangePage(2);
      res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 49, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 25, end: 49, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(25, 50));
    });


    /**
     * Change page process backward with preload
     */
    it('execute page change with preload backward', async () => {
      nodes.setPrefetchLimit(100);
      let obs = nodes.doChangePage(4);
      let res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 199, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 75, end: 99, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(75, 100));

      obs = nodes.doChangePage(nodes.getCurrentPage() - 1);
      res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 199, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 50, end: 74, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(50, 75));
    });


    /**
     * Reaching maxRows limit during page change
     */
    it('reaching maxRows limit during page change', async () => {
      // nodes.setPrefetchLimit(100);
      nodes.maxRows = 40;
      let obs = nodes.doChangePage(1);
      let res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(0, 25));
      expect(nodes.hasMorePages()).toBeTrue();

      obs = nodes.doChangePage(nodes.getCurrentPage() + 1);
      res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 39, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 25, end: 39, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(25, 40));
      expect(nodes.hasMorePages()).toBeFalse();
    });

    /**
     * Reaching maxRows on first page passed by $count parameter
     */
    it('reaching maxRows on first page passed by $count parameter', async () => {
      // nodes.setPrefetchLimit(100);
      // nodes.maxRows = 40;
      nodes.setNodeCallback((startIdx, endIdx) => {
        const x = genData(0, 10) as any;
        x[XS_P_$COUNT] = 10;
        return of(x);
      });
      const obs = nodes.doChangePage(1);
      const res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 9, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 9, range: 25 });
      expect(res.map(x => x.data)).toEqual(genData(0, 10));
      expect(nodes.hasMorePages()).toBeFalse();
    });


    /**
     * TODO: handle caching limit
     */
    // it('handle caching limit', () => {
    // });

  });


  // /**
  //  * Check setting values by apply method
  //  */
  // it('apply fetch data on begin of array', () => {
  //   // add single node
  //   nodes.applyFetchData(0, range(0, 1).map(x => ({ idx: x, name: 'T ' + x })));
  //   expect(nodes).toHaveSize(1);
  //   expect(nodes.asArray()).toEqual([{
  //     'idx': 0,
  //     'name': 'T 0'
  //   }]);
  // });
  //
  // /**
  //  * Check setting values by apply method
  //  */
  // it('apply fetch data on further part of array', () => {
  //   // add single node
  //   nodes.applyFetchData(10, range(0, 1).map(x => ({ idx: x, name: 'T ' + x })));
  //   expect(nodes).toHaveSize(11);
  //   expect(nodes.asArray()).toEqual([
  //     undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, {
  //       'idx': 0,
  //       'name': 'T 0'
  //     }]);
  // });
  //
  //
  // /**
  //  * Check undefined value detection
  //  */
  // it('check if undefined values are found', () => {
  //   // add single node
  //   // nodes[19] = undefined;
  //   nodes.set(19, undefined);
  //   expect(nodes.loadedLength).toEqual(20);
  //
  //   expect(nodes.checkForUndefined(0, 10).length).toEqual(10);
  //   expect(nodes.checkForUndefined(0, 100).length).toEqual(20);
  //   expect(nodes.checkForUndefined(18, 100).length).toEqual(2);
  //   expect(nodes.checkForUndefined(19, 100).length).toEqual(1);
  //   expect(nodes.checkForUndefined(20, 100).length).toEqual(-1);
  //
  //   expect(nodes.checkForUndefined(-1, 10, 'backward').length).toEqual(-1);
  //   expect(nodes.checkForUndefined(0, 10, 'backward').length).toEqual(1);
  //   expect(nodes.checkForUndefined(9, 100, 'backward').length).toEqual(10);
  //   expect(nodes.checkForUndefined(9, 10, 'backward').length).toEqual(10);
  //   expect(nodes.checkForUndefined(4, 10, 'backward').length).toEqual(5);
  //   // expect(nodes.checkForUndefined(0,100)).toEqual(20);
  // });
  //
  //
  // describe('fetch data by callback', () => {
  //
  //   /**
  //    * Fetch initial data
  //    */
  //   it('initial data', async () => {
  //     const data = range(0, 10)
  //       .map(r => ({
  //         idx: r,
  //         name: '' + r
  //       }));
  //     nodes.maxRows = 100;
  //     nodes.setNodeCallback((startIdx: number, endIdx: number) =>
  //       of(data)
  //     );
  //     // spyOn(nodes, 'applyFetchData');
  //     // nodes.calcViewFrame();
  //     nodes.fetch(0, 10);
  //     await new Promise((resolve, reject) => setTimeout(resolve, 500));
  //     // expect(nodes.applyFetchData).toHaveBeenCalled();
  //     expect(nodes).toHaveSize(10);
  //     expect(nodes.asArray()).toEqual(data);
  //   });
  //
  //
  //   /**
  //    * Fetch following
  //    */
  //   it('next data', async () => {
  //     const data = range(0, 10)
  //       .map(r => ({
  //         idx: r,
  //         name: '' + r
  //       }));
  //     nodes.maxRows = 100;
  //     nodes.setNodeCallback((startIdx: number, endIdx: number) => of(data));
  //     nodes.fetch(10, 10);
  //     await new Promise((resolve, reject) => setTimeout(resolve, 500));
  //     expect(nodes).toHaveSize(20);
  //     expect(nodes.asArray()).toEqual([].concat(range(10).map(() => undefined), data));
  //   });
  // });
  //
  //
  // /**
  //  * Reset of array
  //  */
  // it('reset of array', () => {
  //   nodes.push(1, 2, 3, 4);
  //   expect(nodes).toHaveSize(4);
  //   expect(nodes).toHaveSize(4);
  //   nodes.reset();
  //   expect(nodes).toHaveSize(0);
  //   nodes.applyFetchData(100, [1, 2, 3, 4]);
  //   expect(nodes).toHaveSize(104);
  //   nodes.reset();
  //   expect(nodes).toHaveSize(0);
  // });
  //
  //
  // /**
  //  * Next view calculation
  //  */
  // it('next view calculation', () => {
  //   nodes.limit = 10;
  //   nodes.push(...range(0, 200));
  //   // nodes.nextView();
  //   nodes.updateView();
  //   let next = nodes.getValues();
  //   expect(next).toHaveSize(10);
  //   expect(next).toEqual(range(0, 10));
  //   nodes.nextView();
  //   next = nodes.getValues();
  //   expect(next).toHaveSize(10);
  //   expect(next).toEqual(range(10, 20));
  // });
  //
  //
  // /**
  //  * Previous view calculation
  //  */
  // it('previous view calculation', () => {
  //   nodes.limit = 10;
  //   nodes.push(...range(0, 200));
  //   nodes.setView(100, 110);
  //   nodes.previousView();
  //   let next = nodes.getValues();
  //   expect(next).toHaveSize(10);
  //   expect(next).toEqual(range(90, 100));
  //   nodes.previousView();
  //   next = nodes.getValues();
  //   expect(next).toHaveSize(10);
  //   expect(next).toEqual(range(80, 90));
  // });
  //
  //
  // /**
  //  *
  //  */
  // it('iterate over range iterator', async () => {
  //   const v1 = { value: 1 };
  //   const v2 = { value: 2 };
  //   const nodes = new ViewArray();
  //   nodes.push(v1, v2);
  //   nodes.nextView();
  //   // expect(nodes.isDirty()).toBeFalse();
  //   const data = [];
  //   const values: any[] = await new Promise((resolve, reject) => {
  //     nodes.getNodeValues().subscribe(x => {
  //       resolve(x);
  //     }, error => {
  //       console.error(error);
  //     });
  //   });
  //   for (const entry of values) {
  //     data.push(entry.data);
  //   }
  //   expect(data.length).toEqual(nodes.loadedLength);
  //   expect(data).toEqual([v1, v2]);
  // });
  //
  // it('iterate over range iterator with limit', async () => {
  //   const values = range(1, 10).map(x => ({ value: x }));
  //   nodes.push(...values);
  //   nodes.setView(0, null, 5);
  //   const data = [];
  //   const _values: any[] = await new Promise((resolve, reject) => {
  //     nodes.getNodeValues().subscribe((x: any) => {
  //       resolve(x);
  //     }, error => {
  //       console.error(error);
  //     });
  //   });
  //   for (const entry of _values) {
  //     data.push(entry.data);
  //   }
  //   expect(data.length).toEqual(nodes.limit);
  //   expect(data).toEqual(values.filter((value, index) => index < nodes.limit));
  // });
  //
  // /**
  //  * Get values of current frame with limit and offset
  //  */
  // it('get values of current frame with limit and offset', async () => {
  //   const values = range(1, 10).map(x => ({ value: x }));
  //   nodes.push(...values);
  //   nodes.setView(4, null, 5);
  //   const _values: any[] = await new Promise((resolve, reject) => {
  //     nodes.getNodeValues().subscribe(x => {
  //       resolve(x);
  //     }, error => {
  //       console.error(error);
  //     });
  //   });
  //   const data = [];
  //   for (const entry of _values) {
  //     data.push(entry.data);
  //   }
  //   expect(data.length).toEqual(nodes.limit);
  //   const res = values.filter((value, index) => index >= nodes.startIdx);
  //   expect(data).toEqual(res);
  // });
  //

});
