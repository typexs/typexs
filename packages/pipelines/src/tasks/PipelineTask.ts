import { isEmpty, isString, isUndefined } from 'lodash';
import { Incoming, Inject, Injector, ITask, ITaskRuntimeContainer, TaskRuntime } from '@typexs/base';
import { ClassUtils } from '@allgemein/base';
import { MatchUtils } from '@typexs/base/libs/utils/MatchUtils';
import { PipelineTypes } from '../lib/PipelineTypes';
import { PipelineRegistry } from '../lib/PipelineRegistry';
import { PipelineRef } from '../lib/PipelineRef';
import { TN_PIPELINE } from '../lib/Constants';


export class PipelineTask implements ITask {

  name = TN_PIPELINE;

  @Incoming({
    handle: (s: any) => isString(s) ? s.split(',').map(x => x.trim()) : s,
    optional: true,
    valueProvider: PipelineTypes
  })
  pipelines: string[];

  @Inject(PipelineRegistry.NAME)
  registry: PipelineRegistry;

  @TaskRuntime()
  runtime: ITaskRuntimeContainer;

  @Incoming({ optional: true })
  readerOptions: any;


  async exec() {
    const logger = this.runtime.logger();

    if (isEmpty(this.pipelines)) {
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
          const pipe = this.registry.get(x);
          if (isUndefined(pipe)) {
            throw new Error(x + ' is  undefined');
          }
          refs.push(pipe);
        } catch (err) {
          logger.error(err);
        }
      }
    }

    if (isEmpty(refs)) {
      return;
    }
    logger.debug('running pipelines: ' + refs.map(x => x.name).join(', '));

    // let refs = this.pipelines.map(k => this.registry.get(k));
    const traceing = logger.getLevel().name === 'trace';
    for (const ref of refs) {
      let inc = 1;
      logger.debug('execute pipeline: ' + ref.name);
// TODO implement reader options for each pipeline
      const reader = ref.create().addOptions({ logger: logger }).build();
      if (traceing) {
        reader.pipe((data: any) => {
          logger.trace('piped: ' + ClassUtils.getClassName(data) + ' ' + (inc++));
        });
      }
      reader.onCatch((data: any, err: Error) => {
        logger.error(data, err);
      });
      await reader.run();
      logger.debug('finished pipeline: ' + ref.name);
    }
  }
}
