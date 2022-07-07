import {IDatatableOptions} from '@typexs/base-ng';

/**
 * Options for distributed storage table view
 */
export interface IDSOptions extends IDatatableOptions {

  /**
   * Disable / enable input for entity type
   */
  entityTypeSelection?: boolean;

}


export const DEFAULT_DS_OPTIONS: IDSOptions = {
  pagerId: 'page',
  enablePager: true,
  limit: 25,
  freeQueryBuilder: true,
  entityTypeSelection: true
};
