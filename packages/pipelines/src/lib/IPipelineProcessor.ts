import { ClassType } from '@allgemein/schema-api';
import { Processor } from './Processor';
import { IPipelineEntry } from './IPipelineEntry';
import { IProcessorOptions } from './processor/IProcessorOptions';

export interface IPipelineProcessor extends IPipelineEntry {
  processor: {
    /**
     * Name or ClassType of processing object
     */
    name: string | ClassType<Processor>;
    options?: IProcessorOptions;
  };
}

