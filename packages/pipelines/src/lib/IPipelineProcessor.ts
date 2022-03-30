import {ClassType} from '@allgemein/schema-api';
import {Processor} from './Processor';
import {IPipelineEntry} from './IPipelineEntry';
import { IProcessorOptions } from './processor/IProcessorOptions';

export interface IPipelineProcessor extends IPipelineEntry {
  processor: {
    name: string | ClassType<Processor>;
    options?: IProcessorOptions;
  };
}

