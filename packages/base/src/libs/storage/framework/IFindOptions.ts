export interface IFindOptions {

  eager?: boolean;

  cache?: boolean;

  /**
   * Get's all record keys independent of declared.
   */
  raw?: boolean;

  /**
   * If raw the output records can be typed as passed entity type
   */
  typed: boolean;

  limit?: number;

  offset?: number;

  timeout?: number;

  sort?: { [key: string]: 'asc' | 'desc' };

  /**
   * TODO select fields
   */
  select?: string[];

}
