import {Processor} from './Processor';
import {XS_LIBS_PIPELINE_PROCESSORS, XS_LIBS_PIPELINE_READERS} from './Constants';
import {MatchUtils} from '@typexs/base/libs/utils/MatchUtils';
import {AbstractRegistry, ClassType} from '@allgemein/schema-api';
import {Config, IRuntimeLoader, Log} from '@typexs/base';
import {IPipelineSpecification} from './IPipelineSpecification';
import {PipelineRef} from './PipelineRef';
import {IPipelineRegistrySettings} from './IPipelineRegistrySettings';
import {defaults, find, has, isBoolean, isUndefined, snakeCase} from 'lodash';
import {Reader} from './reader/Reader';


export class PipelineRegistry  {

  static NAME: string = PipelineRegistry.name;

  readers: ClassType<Reader>[] = [];

  processors: ClassType<Processor>[] = [];

  pipelines: PipelineRef[] = [];

  config: IPipelineRegistrySettings = {};


  async load(loader: IRuntimeLoader) {
    this.processors = <ClassType<Processor>[]>loader.getClasses(XS_LIBS_PIPELINE_PROCESSORS);
    this.readers = <ClassType<Reader>[]>loader.getClasses(XS_LIBS_PIPELINE_READERS);
    this.config = defaults(Config.get('pipelines', {}), {access: []});
  }

  get(name: string) {
    return this.pipelines.find(p => p.name === name);
  }

  getPipelines() {
    return this.pipelines;
  }

  getReaderClass(name: string) {
    return find(this.readers, x => x.name === name || snakeCase(x.name) === name);
  }

  getProcessorClass(name: string) {
    return find(this.processors, x => x.name === name || snakeCase(x.name) === name);
  }

  access(name: string) {
    if (has(this.config, 'access')) {
      // if access empty then
      let allow = this.config.access.length > 0 ? false : true;
      let count = 0;
      for (const a of this.config.access) {
        if (isUndefined(a.match)) {
          if (/\+|\.|\(|\\||\)|\*/.test(a.name)) {
            a.match = a.name;
          } else {
            a.match = false;
          }
        }
        if (isBoolean(a.match)) {
          if (a.name === name) {
            count++;
            allow = a.access === 'allow';
            return allow;
          }
        } else {
          if (MatchUtils.miniMatch(a.match, name)) {
            allow = allow || a.access === 'allow';
            count++;
          }
        }
      }
      // no allowed or denied
      if (count === 0) {
        allow = true;
      }
      return allow;
    }
    return true;
  }


  register(name: string, spec: IPipelineSpecification) {
    if (this.access(name)) {
      const p = new PipelineRef(this, name, spec);
      this.pipelines.push(p);
      return p;
    } else {
      Log.debug('pipeline-registry: no registration access for ' + name);
    }
    return null;
  }

  find(filter: (x: IPipelineSpecification) => boolean) {
    return this.pipelines.find(x => filter(x.specification));
  }

}
