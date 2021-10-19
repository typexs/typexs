import {IPipelineEntry} from './IPipelineEntry';

export interface IPipelineTransform extends IPipelineEntry {
  transform: any;
}
