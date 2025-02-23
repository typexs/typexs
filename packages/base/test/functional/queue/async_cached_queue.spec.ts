import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';
import { Cache } from '../../../src/libs/cache/Cache';
import { MemoryCacheAdapter } from '../../../src/adapters/cache/MemoryCacheAdapter';
import { AsyncWorkerQueue, IQueueProcessor, IQueueWorkload } from '@allgemein/queue';
import { TestHelper } from '@typexs/testing';

class Workload implements IQueueWorkload {

}


class Processor implements IQueueProcessor<Workload> {

  do(workLoad: Workload): Promise<void> {
    // doing something with the workload
    return new Promise<void>(function(resolve) {
      setTimeout(function() {
        resolve();
      }, 100);
    });
  }


  onEmpty(): Promise<void> {
    return null;
  }
}

let cache: Cache = null;

@suite('functional/queue/async-cached-queue')
class AsyncCacheQueueTests {

  async before() {
    cache = new Cache();
    await cache.register(MemoryCacheAdapter);
    await cache.configure('mem-cache', {});
  }

  async after() {
    if (cache) {
      await cache.shutdown();
    }
  }


  @test
  async enqueueSingleWorkloadAndWaitUntilAllDone() {
    const p = new Processor();
    const q = new AsyncWorkerQueue<Workload>(p, { cache: cache });
    await q.pause();
    expect(q.isPaused()).to.eq(true);

    q.push(new Workload());
    q.resume();
    expect(q.isPaused()).to.eq(false);
    expect(q.amount()).to.eq(1);

    await q.await();
    expect(q.amount()).to.eq(0);
  }


  @test
  async enqueueMultipleWorkloadAndWaitUntilAllDone() {
    const parallel: number = 5;
    const p = new Processor();
    const q = new AsyncWorkerQueue<Workload>(p, { name: 'enqueue_test', concurrent: parallel, cache: cache });

    for (let i = 0; i < 20; i++) {
      q.push(new Workload());
      expect(q.amount()).to.greaterThan(0);
      expect(q.running()).to.lessThan(parallel + 1);
    }

    // await TestHelper.waitFor(() => q.doingEnqueueing() === 0);

    await q.await();
    expect(q.running()).to.eq(0);
    expect(q.enqueued()).to.eq(0);
    expect(q.amount()).to.eq(0);
  }

  @test
  async enqueueSingleWorkloadAndWaitUntilWorkIsDone() {
    const p = new Processor();
    const q = new AsyncWorkerQueue<Workload>(p, { cache: cache });
    await q.pause();
    expect(q.isPaused()).to.eq(true);

    const jobRef = await q.push(new Workload());
    await TestHelper.waitFor(() => q.doingEnqueueing() === 0);
    expect(q.amount()).to.eq(1);
    let job = await jobRef.get();
    expect(job.isEnqueued()).to.eq(true);
    expect(job.isStarted()).to.eq(false);
    expect(job.isFinished()).to.eq(false);
    q.resume();
    expect(q.isPaused()).to.eq(false);

    await job.starting(q);
    job = await jobRef.get();
    expect(job.isEnqueued()).to.eq(false);
    expect(job.isStarted()).to.eq(true);
    expect(job.isFinished()).to.eq(false);

    await job.done(q);
    job = await jobRef.get();
    expect(job.isEnqueued()).to.eq(false);
    expect(job.isStarted()).to.eq(false);
    expect(job.isFinished()).to.eq(true);
    expect(q.amount()).to.eq(0);
  }

}
