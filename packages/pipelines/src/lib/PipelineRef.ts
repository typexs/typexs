import { IPipelineSpecification } from './IPipelineSpecification';
import { ClassRef, ClassType } from '@allgemein/schema-api';
import { TreeUtils } from '@allgemein/base';
import { IOptionsOverride } from './IOptionsOverride';
import { IPipelineProcessor } from './IPipelineProcessor';
import { PipelineRegistry } from './PipelineRegistry';
import { PipelineBuilder } from './PipelineBuilder';
import { Reader } from './reader/Reader';
import { clone, has, isEmpty, isString, last, merge, set, snakeCase } from '@typexs/generic';


export class PipelineRef {

  registry: PipelineRegistry;

  name: string;

  specification: IPipelineSpecification;

  constructor(registry: PipelineRegistry, name: string, spec: IPipelineSpecification) {
    this.registry = registry;
    this.name = name;
    this.specification = spec;
  }


  findEntityClazz(name: string) {
    const refs = ClassRef.filter(x => x.name === name);
    if (!isEmpty(refs)) {
      return last(refs).getClass();
    }
    return null;
  }


  createOptions(opts: any) {
    const readerOpts = clone(opts);
    TreeUtils.walk(readerOpts, x => {
      if (x.key === '$clazz') {
        const clazz = this.findEntityClazz(x.value);
        if (clazz) {
          const loc = clone(x.location);
          loc.pop();
          set(readerOpts, loc.join('.'), clazz);
        } else {
          throw new Error('cant find classRef for ' + x.value);
        }
      }
    });
    return readerOpts;

  }

  create(...overrideOpts: IOptionsOverride[]) {

    const build = new PipelineBuilder(this);


    overrideOpts = overrideOpts || [];

    let readerClass: ClassType<Reader> = null;
    if (isString(this.specification.reader.name)) {
      readerClass = this.registry.getReaderClass(this.specification.reader.name);
    } else {
      readerClass = this.specification.reader.name;
    }


    let opts = clone(this.specification.reader.options);
    const overrideReaderOpts = overrideOpts.find(x => x && snakeCase(x.name) === snakeCase(readerClass.name));
    if (overrideReaderOpts) {
      opts = merge(opts, overrideReaderOpts);
    }

    const readerOpts = this.createOptions(opts);

    build.setReaderClass(readerClass, readerOpts);

    // const reader: Reader = Reflect.construct(readerClass, [readerOpts]);
    for (const p of this.specification.pipe) {
      if (has(p, 'processor')) {
        const processorEntry = (<IPipelineProcessor>p).processor;
        let processorClass: any = null;
        if (isString(processorEntry.name)) {
          processorClass = this.registry.getProcessorClass(processorEntry.name);
        } else {
          processorClass = processorEntry.name;
        }
        const overrideProcessorOpts = overrideOpts.find(x =>
          x &&
          snakeCase(x.name) === snakeCase(processorClass.name)
        );
        let opts = clone(processorEntry.options);
        if (overrideProcessorOpts) {
          opts = merge(opts, overrideProcessorOpts);
        }
        const popts = this.createOptions(opts);

        build.setPipe(processorClass, popts);

        // const processor = Reflect.construct(processorClass, [popts]);
        // reader.pipe(processor);
      }
    }

    return build;
  }


}
