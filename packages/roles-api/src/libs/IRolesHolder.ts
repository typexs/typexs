import {IRole} from './IRole';

/**
 * specification for entities (like user or group) which can holder roles
 */
export interface IRolesHolder {


  /**
   * return a unique identifier for the resource
   */
  getIdentifier(): string | number;

  /**
   * get given roles
   */
  getRoles(): IRole[];

}
