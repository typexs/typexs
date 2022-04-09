import { suite, test } from '@testdeck/mocha';
import { Readable } from 'stream';
import { expect } from 'chai';
import { TestHelper } from '@typexs/testing';
import { StreamLogger } from '../../../src/libs/logging/StreamLogger';
import { EventEmitter } from 'events';
import { LOG_EVENT_NAME } from '../../../src/libs/logging/Constants';

@suite('functional/logging/steam-logger')
class StreamLoggerSpec {


  @test
  async 'basic stream logic'() {
    const data: string[] = [];
    const readable = new Readable();
    readable.on('data', (chunk: any) => {
      data.push(chunk.toString());
    });
    readable.push('hallo');
    readable.push(null);
    await TestHelper.waitFor(() => data.length > 0, 10, 10);
    // Log.options({enable: true, level: 'debug'});
    // const defaultLogger = Log.getLogger();
    // const level = defaultLogger.getLevel();
    expect(data).to.deep.eq(['hallo']);
  }

  @test
  async 'basic stream logic repeating'() {
    const data: string[] = [];
    const readable = new Readable();
    readable.on('data', (chunk: any) => {
      data.push(chunk.toString());
    });
    readable.push('hallo');
    readable.push('hallo');
    readable.push(null);

    await TestHelper.waitFor(() => data.length > 1, 10, 10);
    // Log.options({enable: true, level: 'debug'});
    // const defaultLogger = Log.getLogger();
    // const level = defaultLogger.getLevel();
    expect(data).to.deep.eq(['hallo', 'hallo']);
  }

  @test
  async 'basic stream logic repeating again'() {
    const data: string[] = [];
    const readable = new Readable({
      read(size: number) {
      }
    });
    readable.on('data', (chunk: any) => {
      data.push(chunk.toString());
    });
    readable.push('hallo');
    readable.push('hallo');

    await TestHelper.waitFor(() => data.length > 1, 10, 10);
    // Log.options({enable: true, level: 'debug'});
    // const defaultLogger = Log.getLogger();
    // const level = defaultLogger.getLevel();
    readable.push(null);

    expect(data).to.deep.eq(['hallo', 'hallo']);
  }


  @test
  async 'stream logger distribute log message through readerstream'() {
    // const readable = new Readable({
    //   read(size: number) {
    //   }
    // });
    const emitter = new EventEmitter();
    const logger = new StreamLogger('test', { emitter: emitter });
    const data: string[] = [];
    emitter.on(LOG_EVENT_NAME, (chunk: any) => {
      data.push(chunk);
    });
    logger.info('hallo');
    await TestHelper.waitFor(() => data.length > 0, 10, 10);
    expect(data.shift()).to.deep.include({ level: 'info', args: ['hallo'] });
  }

}

