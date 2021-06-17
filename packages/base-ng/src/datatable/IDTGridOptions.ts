import {IGridColumn} from './IGridColumn';
import {IQueryComponentApi} from '../api/querying/IQueryComponentApi';

export interface IDTGridOptions {

  /**
   * enable or disable pager
   */
  enablePager?: boolean;

  /**
   * Pager id for uniq identification
   */
  pagerId?: string;

  /**
   * Rows to show per page
   */
  limit?: number;

  /**
   * Initial offset
   */
  offset?: number;

  /**
   * Free Query builder
   */
  freeQueryBuilder?: boolean;

  /**
   * Define a function which can modify columns
   *
   * @param columns
   */
  columnsPostProcess?: (columns: IGridColumn[], component: IQueryComponentApi) => void;

  /**
   * Use prefined columns, do not generate based on results or entity properties
   *
   * @param columns
   */
  columnsOverride?: boolean;

  /**
   * Initial query sorting
   */
  sorting?: any;

  /**
   * Define the type of query (default: query)
   */
  queryType?: 'query' | 'aggregate';

  /**
   * Additional query options to pass
   */
  queryOptions?: any;

  /**
   * Additional query options to pass
   */
  predefinedFilter?: any;

  /**
   * query on init
   */
  queryOnInit?: boolean;

}
