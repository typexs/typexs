import { PipelineRef } from './PipelineRef';
import { ClassType } from '@allgemein/schema-api';
import { Processor } from './Processor';

import { Log } from '@typexs/base';
import { Reader } from './reader/Reader';
import { IReader } from './reader/IReader';
import { findIndex, isNumber, isString, merge, snakeCase } from '@typexs/generic';


export class PipelineBuilder {

  ref: PipelineRef;

  optionOverrides: any[] = [];

  reader: ClassType<Reader> = null;

  readerOpts: any = {};

  pipe: { proc: ClassType<Processor>; ots: any }[] = [];


  constructor(ref: PipelineRef) {
    this.ref = ref;
  }


  setReaderClass(readerClass: ClassType<Reader>, readerOpts: any) {
    this.reader = readerClass;
    this.readerOpts = readerOpts || {};
    return this;
  }

  /**
   * Add a pipe definition to process stack
   *
   * @param processorClass
   * @param popts
   */
  setPipe(processorClass: any, popts: any = {}) {
    this.pipe.push({proc: processorClass, ots: popts || {}});
    return this;
  }


  addOption(nr: string | number, opts: any) {
    if (isNumber(nr)) {
      this.pipe[nr].ots = merge(this.pipe[nr].ots, opts);
    } else if (isString(nr)) {
      const idx = findIndex(this.pipe, p => p.proc.name === nr || snakeCase(p.proc.name) === nr);
      this.addOption(idx, opts);
    }
    return this;
  }

  addReaderOption(opts: any) {
    this.readerOpts = merge(this.readerOpts, opts);
    return this;
  }

  /**
   * Add additional options to all components
   *
   * @param opts
   */
  addOptions(opts: any) {
    this.addReaderOption(opts);
    for (let i = 0; i < this.pipe.length; i++) {
      this.addOption(i, opts);
    }
    return this;
  }


  build(): IReader {
    try {
      const reader = Reflect.construct(this.reader, [this.readerOpts]);
      for (const pipe of this.pipe) {
        reader.pipe(Reflect.construct(pipe.proc, [pipe.ots]));
      }
      return reader;
    } catch (e) {
      Log.error(e);
      throw e;
    }

  }
}
