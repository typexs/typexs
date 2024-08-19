import { IArrayEvent, ViewArray } from './ViewArray';
import { range } from 'lodash';
import { Observable, of } from 'rxjs';
import { K_DATA_UPDATE, K_INITIAL, K_RESET, T_VIEW_ARRAY_STATES } from './Constants';
import { XS_P_$COUNT } from '@typexs/base';
import { K_INFINITE, K_PAGED } from './../../datatable/api/IGridMode';
import { fakeAsync } from '@angular/core/testing';
import { first } from 'rxjs/operators';

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
 * Test for ViewArray object handling data
 */
describe('ViewArray', () => {
  let nodes: ViewArray<any>;

  beforeEach(() => {
    nodes = new ViewArray();
  });


  /**
   * Add data manuell
   */
  it('push data to the end of array manually', () => {
    const data = genData(0, 1);
    nodes.push(...data);
    expect(nodes).toHaveSize(1);
    const arr = nodes.asArray();
    expect(arr).toEqual(data);
  });


  it('check state initialize on construct', fakeAsync(() => {
    let state = null;
    nodes.getState().pipe(first()).subscribe(x => {
      state = x;
    });
    expect(state).toEqual({ type: K_INITIAL });
  }));

  it('check state on reset', fakeAsync(() => {
    const state: IArrayEvent[] = [];
    const sub = nodes.getState().subscribe(x => {
      state.push(x);
    });
    nodes.push({ name: 'Test' });
    nodes.reset();
    sub.unsubscribe();
    expect(state.map(x => x.type)).toEqual([
      K_INITIAL,
      K_DATA_UPDATE,
      K_RESET,
      K_INITIAL
    ]);
  }));

  it('check state when data added', fakeAsync(() => {
    nodes.push({ name: 'Test' });
    let state = null;
    nodes.getState().pipe(first()).subscribe(x => {
      state = x;
    });
    expect(state).toEqual({ type: K_DATA_UPDATE });
  }));

  it('check frame position', fakeAsync(() => {
    let change = nodes['updateFramedPosition'](0, 10);
    expect(change).toEqual({ start: 0, end: 10, range: 25, change: true });
    delete change['change'];
    expect(change).toEqual(nodes.getFrameBoundries());

    change = nodes['updateFramedPosition'](10, 0);
    expect(change).toEqual({ start: 0, end: 0, range: 25, change: true });
    delete change['change'];
    expect(change).toEqual(nodes.getFrameBoundries());

    nodes.maxRows = 5;
    change = nodes['updateFramedPosition'](0, 10);
    expect(change).toEqual({ start: 0, end: 4, range: 25, change: true });
    delete change['change'];
    expect(change).toEqual(nodes.getFrameBoundries());

    change = nodes['updateFramedPosition'](10, 0);
    expect(change).toEqual({ start: 0, end: 0, range: 25, change: true });
    delete change['change'];
    expect(change).toEqual(nodes.getFrameBoundries());
  }));


  it('append data on the end', () => {
    let node = nodes.append({ name: 'Test' });
    expect(node.idx).toEqual(0);
    expect(node.data).toEqual({ name: 'Test' });
    node = nodes.append({ name: 'Test 2' });
    expect(node.idx).toEqual(1);
    expect(node.data).toEqual({ name: 'Test 2' });
    expect(nodes.loadedLength).toEqual(2);
    expect(nodes.max()).toEqual(2);
  });

  it('insert data on specific position manually', () => {
    const data = genData(0, 5);
    nodes.push(...data);
    expect(nodes).toHaveSize(5);
    expect(nodes.max()).toEqual(5);
    const node = nodes.insert(2, { name: 'Inserted data' });
    expect(node.idx).toEqual(2);
    expect(nodes).toHaveSize(6);
    expect(nodes.max()).toEqual(6);
    expect(nodes.get(3)).toEqual({ idx: 2, name: 'T 2' });
  });

  it('remove data without down-count', () => {
    const data = genData(0, 5);
    nodes.push(...data);
    expect(nodes).toHaveSize(5);
    expect(nodes.max()).toEqual(5);
    nodes.remove(2);
    expect(nodes).toHaveSize(4);
    expect(nodes.max()).toEqual(5);
  });

  it('remove data with down-count', () => {
    const data = genData(0, 5);
    nodes.push(...data);
    expect(nodes).toHaveSize(5);
    expect(nodes.max()).toEqual(5);
    nodes.remove(2, true);
    expect(nodes).toHaveSize(4);
    expect(nodes.max()).toEqual(4);
  });

  it('move data', () => {
    const data = genData(0, 6);
    nodes.push(...data);
    expect(nodes).toHaveSize(6);
    expect(nodes.getLoadedAsArray().map(x => x.data)).toEqual(data);
    nodes.move(1, 4);
    expect(nodes).toHaveSize(6);
    expect(nodes.getLoadedAsArray().map(x => x.data)).toEqual([
      { idx: 0, name: 'T 0' },
      { idx: 2, name: 'T 2' },
      { idx: 3, name: 'T 3' },
      { idx: 1, name: 'T 1' },
      { idx: 4, name: 'T 4' },
      { idx: 5, name: 'T 5' }
    ]);
  });

  describe('in infinite mode with callback', () => {

    beforeEach(() => {
      nodes.setFrameMode(K_INFINITE);
      nodes.setNodeCallback((startIdx, endIdx) => of(genData(startIdx, endIdx + 1)));
    });

    it('load nodes', async () => {
      const obs = nodes.doChangeSpan(0, 24);
      const res = await waitForObs(obs);
      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 0, end: 24, range: 25 });
      const data = genData(0, 25);
      expect(res.map(x => x.data)).toEqual(data);
      expect(nodes.getLoadedAsArray().map(x => x.data)).toEqual(data);
    });

    it('load nodes multiple times parallel', async () => {
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


    it('load nodes till maxRows reached', async () => {
      nodes.maxRows = 100;
      const startIdxs = range(0, 200, 20);
      const promise = [];
      while (startIdxs.length > 0) {
        const s = startIdxs.shift();
        const obs = nodes.doChangeSpan(s, s + 25 - 1);
        promise.push(waitForObs(obs));
      }

      await Promise.all(promise);

      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 75, end: 99, range: 25 });

      const loaded = nodes.getLoadBoundries();
      expect(loaded).toEqual({ start: 0, end: 99, range: 25 });

      const data = nodes.getLoadedAsArray();
      expect(data).toHaveSize(100);
      expect(data.map(x => x.data)).toEqual(genData(0, 100));
    });

  });


  describe('in paged mode with callback', () => {

    beforeEach(() => {
      nodes.setFrameMode(K_PAGED);
      nodes.setNodeCallback((startIdx, endIdx) => of(genData(startIdx, endIdx + 1)));
    });

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


    it('pull next data and load missing', async () => {
      nodes.setCacheLimit(10);
      let ready = nodes.isFrameReady();
      expect(ready).toBeFalse();
      const frame = nodes.getFrameBoundries();
      expect(frame).toEqual({ start: 0, end: -1, range: 25 });
      let obs = nodes.doFrameReload();
      let res = await waitForObs(obs);
      ready = nodes.isFrameReady();
      expect(ready).toBeFalse();
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: -1, range: 25 });

      let page = nodes.getCurrentPage();
      expect(page).toEqual(1);
      obs = nodes.doChangePage(page + 1);
      res = await waitForObs(obs);

      page = nodes.getCurrentPage();
      expect(page).toEqual(2);
      ready = nodes.isFrameReady();
      expect(ready).toBeTrue();

      const arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toHaveSize(nodes.getFrameBoundries().range);
      expect(arr).toEqual(genData(25, 50));
    });

    it('load eager coming data and change next', async () => {
      nodes.setPrefetchLimit(100);
      nodes.setCacheLimit(100);
      const obs = nodes.doPreload();
      const res = await waitForObs(obs);
      expect(nodes.getLoadBoundries()).toEqual({ start: 0, end: 99, range: 25 });
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });

      let okay = nodes.setCurrentPage(1);
      nodes['updateFrameBoundries'](okay);
      expect(nodes.isFrameReady()).toBeTrue();
      expect(nodes.getFrameBoundries()).toEqual({ start: 0, end: 24, range: 25 });
      let arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toEqual(genData(0, 25));

      okay = nodes.setCurrentPage(2);
      nodes['updateFrameBoundries'](okay);
      expect(nodes.isFrameReady()).toBeTrue();
      expect(nodes.getFrameBoundries()).toEqual({ start: 25, end: 49, range: 25 });
      arr = nodes.getFrameAsArray().map(x => x.data);
      expect(arr).toEqual(genData(25, 50));
    });


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

    it('reaching maxRows on first page passed by $count parameter', async () => {
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


});
