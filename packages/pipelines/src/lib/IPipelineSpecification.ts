import {IPipelineProcessor} from './IPipelineProcessor';
import {IPipelineTransform} from './IPipelineTransform';
import {IPipelineEntry} from './IPipelineEntry';
import {IPipelineReader} from './reader/IPipelineReader';

export interface IPipelineSpecification {
  reader: IPipelineReader;
  pipe: (IPipelineProcessor | IPipelineTransform | IPipelineEntry)[];
}

