export const __DISTRIBUTED_ID__ = '__distributedId__';
export const __REMOTE_IDS__ = '__remoteIds__';

export const XS_P_$SAVED = '$saved';
export const XS_P_$ERRORED = '$errored';


export type DS_OPERATION = 'find' | 'remove' | 'save' | 'update' | 'aggregate';


/**
 * Distributed storage url paths
 */

export const API_CTRL_DISTRIBUTED_STORAGE = '/distributed';

// Get method
export const _API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY = '/find/:name';
export const API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_FIND_ENTITY;

// Get method
export const _API_CTRL_DISTRIBUTED_STORAGE_GET_ENTITY = '/entity/:nodeId/:name/:id';
export const API_CTRL_DISTRIBUTED_STORAGE_GET_ENTITY =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_GET_ENTITY;

export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_ACCESS_ENTITY = 'allow access distributed storage entity';
export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_ACCESS_ENTITY_PATTERN = 'allow access distributed storage entity :name';

// Post method
export const _API_CTRL_DISTRIBUTED_STORAGE_SAVE_ENTITY = '/save/:nodeId/:name';
export const API_CTRL_DISTRIBUTED_STORAGE_SAVE_ENTITY =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_SAVE_ENTITY;

export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_SAVE_ENTITY = 'allow save distributed storage entity';
export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_SAVE_ENTITY_PATTERN = 'allow save distributed storage entity :name';

// Post method
export const _API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITY = '/update/:nodeId/:name/:id';
export const API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITY =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITY;

// Put method
export const _API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITIES_BY_CONDITION = '/update/:nodeId/:name';
export const API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITIES_BY_CONDITION =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_UPDATE_ENTITIES_BY_CONDITION;

export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_UPDATE_ENTITY = 'allow update distributed storage entity';
export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_UPDATE_ENTITY_PATTERN = 'allow update distributed storage entity :name';


// Delete method
export const _API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITY = '/delete/:nodeId/:name/:id';
export const API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITY =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITY;

export const _API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITIES_BY_CONDITION = '/delete/:nodeId/:name';
export const API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITIES_BY_CONDITION =
  API_CTRL_DISTRIBUTED_STORAGE +
  _API_CTRL_DISTRIBUTED_STORAGE_DELETE_ENTITIES_BY_CONDITION;

export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_DELETE_ENTITY = 'allow delete distributed storage entity';
export const PERMISSION_ALLOW_DISTRIBUTED_STORAGE_DELETE_ENTITY_PATTERN = 'allow delete distributed storage entity :name';
