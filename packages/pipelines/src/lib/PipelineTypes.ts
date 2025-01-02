import { PipelineRegistry } from './PipelineRegistry';
import { Inject } from '@typexs/base';
import { IValueProvider } from '@typexs/tasks/lib/decorators/IValueProvider';
import { IPropertyRef } from '@allgemein/schema-api';
import { ExprDesc } from '@allgemein/expressions';


export class PipelineTypes implements IValueProvider<string[]> {


  @Inject(PipelineRegistry.NAME)
  registry: PipelineRegistry;


  get(entity?: any, property?: IPropertyRef, hint?: ExprDesc): string[] {
    const pipeNames = this.registry.pipelines.map(x => x.name);
    pipeNames.unshift('__all__');
    return pipeNames;
  }
}
