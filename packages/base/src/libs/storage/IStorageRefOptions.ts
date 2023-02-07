export const K_STORAGE = 'storage';

/**
 * Generic object structure for storage ref options
 */
export interface IStorageRefOptions {

  /**
   * name of this storage
   */
  readonly name?: string;

  /**
   * framework of storage
   */
  framework?: string;

  /**
   * Type if framework supports multiple types
   */
  readonly type?: string;

  // baseClass?: StringOrFunction;

  /**
   * Connect on startup to check or create entities in tables
   */
  connectOnStartup?: boolean;

  /**
   * Name or names of storages hows entities will be added
   */
  extends?: string | string[];

  /**
   * Entities handled by this storage
   */
  entities?: ((Function | any | string))[];


  /**
   * Set store location for schema extensions, to reuse this on reload add location to entities option.
   */
  storeLocation?: string;

  /**
   * Only for output reason - id of storage setting
   */
  id?: number;


  /**
   * Only for output reason - active status of storage setting
   */
  active?: boolean;

  /**
   * Only for output reason - mode of setting
   */
  mode?: 'db' | 'config';
}
