import {IPipelineSpecification} from './IPipelineSpecification';
import * as _ from 'lodash';
import {AbstractRef, ClassRef, ClassType, IEntityRef, METATYPE_ENTITY} from '@allgemein/schema-api';
import {TreeUtils} from '@allgemein/base';
import {IOptionsOverride} from './IOptionsOverride';
import {IPipelineProcessor} from './IPipelineProcessor';
import {PipelineRegistry} from './PipelineRegistry';
import {PipelineBuilder} from './PipelineBuilder';
import {Reader} from './reader/Reader';

export class PipelineRef  {

  registry: PipelineRegistry;

  name: string;

  specification: IPipelineSpecification;

  constructor(registry: PipelineRegistry, name: string, spec: IPipelineSpecification) {
    this.registry = registry;
    this.name = name;
    this.specification = spec;
  }

  findEntityClazz(name: string) {
    const ref = ClassRef.find(name);
    if (ref) {
      return ref.getClass();
    }
    // for (const lookupRegistry of LookupRegistry.getLookupRegistries()) {
    //   const classRef: ClassRef = lookupRegistry.find(METATYPE_CLASS_REF, (x: ClassRef) => x.className === name);
    //   if (classRef) {
    //     return classRef.getClass();
    //   }
    // }
    return null;
  }

  createOptions(opts: any) {
    const readerOpts = _.clone(opts);
    TreeUtils.walk(readerOpts, x => {
      if (x.key === '$clazz') {
        const clazz = this.findEntityClazz(x.value);
        if (clazz) {
          const loc = _.clone(x.location);
          loc.pop();
          _.set(readerOpts, loc.join('.'), clazz);
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
    if (_.isString(this.specification.reader.name)) {
      readerClass = this.registry.getReaderClass(this.specification.reader.name);
    } else {
      readerClass = this.specification.reader.name;
    }


    let opts = _.clone(this.specification.reader.options);
    const overrideReaderOpts = overrideOpts.find(x => x && _.snakeCase(x.name) === _.snakeCase(readerClass.name));
    if (overrideReaderOpts) {
      opts = _.merge(opts, overrideReaderOpts);
    }

    const readerOpts = this.createOptions(opts);

    build.setReaderClass(readerClass, readerOpts);

    // const reader: Reader = Reflect.construct(readerClass, [readerOpts]);
    for (const p of this.specification.pipe) {
      if (_.has(p, 'processor')) {
        const processorEntry = (<IPipelineProcessor>p).processor;
        let processorClass: any = null;
        if (_.isString(processorEntry.name)) {
          processorClass = this.registry.getProcessorClass(processorEntry.name);
        } else {
          processorClass = processorEntry.name;
        }
        const overrideProcessorOpts = overrideOpts.find(x =>
          x &&
          _.snakeCase(x.name) === _.snakeCase(processorClass.name)
        );
        let opts = _.clone(processorEntry.options);
        if (overrideProcessorOpts) {
          opts = _.merge(opts, overrideProcessorOpts);
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
