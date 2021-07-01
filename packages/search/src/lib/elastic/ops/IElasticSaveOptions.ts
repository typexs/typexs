import {ISaveOptions} from '@typexs/base';
import {IElasticOptions} from './IElasticOptions';

export interface IElasticSaveOptions extends ISaveOptions, IElasticOptions {

  wait_for_active_shards?: string;

  op_type?: 'index' | 'create';

  refresh?: boolean;

  routing?: string;

  timeout?: string;

  version?: number;

  version_type?: 'internal' | 'external' | 'external_gte';

  if_seq_no?: number;

  if_primary_term?: number;

  pipeline?: string;

  require_alias?: boolean;

  /**
   *
   */
  passResults?: boolean;

}


