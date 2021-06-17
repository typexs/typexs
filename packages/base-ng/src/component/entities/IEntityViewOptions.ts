export interface IEntityViewOptions {
  /**
   * Allow reloading of content
   */
  elem?: {
    reload?: boolean
  };

  /**
   * Request options
   */
  req?: {
    raw?: boolean
  };
}
