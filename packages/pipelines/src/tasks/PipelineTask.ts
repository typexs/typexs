import * as _ from 'lodash';
import {Incoming, Inject, Injector, ITask, ITaskRuntimeContainer, TaskRuntime} from '@typexs/base';
import {ClassUtils} from '@allgemein/base';
import {MatchUtils} from '@typexs/base/libs/utils/MatchUtils';
import {PipelineTypes} from '../lib/PipelineTypes';
import {PipelineRegistry} from '../lib/PipelineRegistry';
import {PipelineRef} from '../lib/PipelineRef';


export class PipelineTask implements ITask {

  name = 'pipeline';

  @Incoming({
    handle: (s: any) => _.isString(s) ? s.split(',').map(x => x.trim()) : s,
    optional: true,
    valueProvider: PipelineTypes
  })
  pipelines: string[];

  @Inject(PipelineRegistry.NAME)
  registry: PipelineRegistry;


  @TaskRuntime()
  runtime: ITaskRuntimeContainer;


  async exec() {
    const logger = this.runtime.logger();

    if (_.isEmpty(this.pipelines)) {
      logger.info(Injector.get(PipelineTypes).get());
      return;
    }
    const refs: PipelineRef[] = [];
    for (const x of this.pipelines) {
      if (x === '__all__') {
        this.registry.pipelines.map(x => refs.push(x));
        break;
      } else if (/\*/.test(x)) {
        this.registry.pipelines.filter(p => MatchUtils.miniMatch(x, p.name)).map(x => refs.push(x));
      } else {
        try {
          refs.push(this.registry.get(x));
        } catch (err) {
          logger.error(err);
        }

      }
    }

    // let refs = this.pipelines.map(k => this.registry.get(k));

    for (const ref of refs) {
      let inc = 1;
      const reader = ref.create().addOptions({logger: logger}).build();
      reader.pipe((data: any) => {
        logger.debug('piped: ' + ClassUtils.getClassName(data) + ' ' + (inc++));
      });
      reader.onCatch((data: any, err: Error) => {
        logger.error(data, err);
      });
      await reader.run();
    }

  }
}
