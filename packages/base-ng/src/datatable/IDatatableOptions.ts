import { IGridColumn } from './IGridColumn';
import { IQueryComponentApi } from '../api/querying/IQueryComponentApi';
import { GRID_MODE } from './Constants';
import { Observable } from 'rxjs';

export interface IDatatableOptions {

  /**
   * Mode of data fetching
   *
   * - paged - a pager will be integrated in the view
   * - infinite - an infinite scoll with reload on page bottom reach
   * - view - show only the once loaded rows
   */
  mode?: GRID_MODE;

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
   * Entries to fetch on data source request
   */
  fetchLimit?: number;

  /**
   * Initial offset
   */
  offset?: number;


  /**
   * Pass input annotations to underlying component
   */
  passInputs?: string[];

  /**
   * Pass output annotations to underlying component
   */
  passOutputs?: string[];

  /**
   * Pass methods to underlying component
   */
  passMethods?: string[];

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

  /**
   * TODO?
   */
  namespace?: string;


  /**
   * Define a function
   *
   * @param columns
   */
  beforeQuery?: (query: any, options: any) => void;


  /**
   * Insertable
   */
  insertable?: boolean;


  /**
   * Editable
   */
  editable?: boolean;


  /**
   * Deletable
   */
  deletable?: boolean;

  /**
   * Callback for modifications
   */
  crudCallbacks?: {
    doCreate?: (entries: any[]) => Observable<boolean>;
    doUpdate?: (entries: any[]) => Observable<boolean>;
    doDelete?: (entries: any[]) => Observable<boolean>;
  };
}
