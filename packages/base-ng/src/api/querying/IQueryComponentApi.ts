import {IEntityRef} from '@allgemein/schema-api';
import {IQueringService} from './IQueringService';

export interface IQueryComponentApi {

  getEntityRef(): IEntityRef;

  getQueryService(): IQueringService;
}
