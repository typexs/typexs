import {IFindOptions} from '@typexs/entity';
import {IElasticOptions} from './IElasticOptions';
import {IElasticHighlight} from './IElasticHighlight';
import {IElasticFacets} from './IElasticFacets';

export interface IElasticFindOptions extends IFindOptions, IElasticOptions {

  /**
   * pass internal results to $index field
   */
  passResults?: boolean;

  /**
   * If conditions are null then define how results should be delivered.
   * - all results (default)
   * - empty results
   * - skip - ignore passing query dsl to body
   */
  onEmptyConditions?: 'match_all' | 'match_none' | 'skip';

  /**
   * Allow passing original elastic DSL query and ignore interpretion of mango query
   */
  rawQuery?: boolean;

  /**
   * Define raw aggs
   */
  aggs?: any;

  /**
   * Enable Highlight
   */
  highlight?: IElasticHighlight;

  /**
   * Get facets for search results
   */
  facets?: IElasticFacets;
}
