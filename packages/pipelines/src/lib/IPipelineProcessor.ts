import {ClassType} from '@allgemein/schema-api';
import {IProcessorOptions, Processor} from './Processor';
import {IPipelineEntry} from './IPipelineEntry';

export interface IPipelineProcessor extends IPipelineEntry {
  processor: {
    name: string | ClassType<Processor>;
    options?: IProcessorOptions;
  };
}

