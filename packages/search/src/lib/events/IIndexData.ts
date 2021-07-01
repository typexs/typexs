
export interface IIndexData {
  /**
   * Action name
   */
  action: 'save' | 'delete' | 'delete_by_condition' | 'update' | 'update_by_condition';
  /**
   * StorageRef
   */
  ref: string;
  /**
   * Registry
   */
  registry?: string;
  /**
   * StorageRef
   */
  class?: string;
  /**
   * Object data or update data
   */
  obj: any;
  /**
   * Id of object
   */
  id?: string;
  /**
   * Condition
   */
  condition?: any;
  /**
   * Id of object
   */
  options?: any;
}
