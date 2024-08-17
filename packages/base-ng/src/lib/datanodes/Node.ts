/**
 * Grid row wrapper for passed data
 */
export class Node<T> {

  /**
   * Idx of the row in the grid
   */
  idx: number;


  /**
   * Contains the raw row data
   */
  data: T = undefined;

  /**
   * Creation timestamp
   *
   * @private
   */
  private created: number;

  /**
   * Constructor
   *
   * @param data
   * @param idx
   */
  constructor(data: T, idx?: number) {
    this.data = data;
    this.idx = idx;
    this.created = Date.now();
  }

  isEmpty() {
    return typeof this.data === 'undefined';
  }

  getTimestamp() {
    return this.created;
  }
}
