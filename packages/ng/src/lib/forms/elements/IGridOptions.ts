export interface IGridOptions {
  /**
   * if fixed only the rows included will be shown, without the possiblity of addRow or removeRow
   */
  fixed?: boolean;

  nr?: boolean;

}

export const DEFAULT_GRID_OPTIONS: IGridOptions = {
  fixed: false,
  nr: true
};
