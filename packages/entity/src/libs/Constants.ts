

export const NAMESPACE_BUILT_ENTITY = 'built-entity';

/**
 * @deprecated
 */
export const REGISTRY_TXS_SCHEMA = NAMESPACE_BUILT_ENTITY;

export const XS_LINK_VARIANT = 'linkVariant';
export const XS_RELATION_TYPE_GLOBAL = 'global';

/**
 * Options keys
 */
export const K_STORABLE = 'storable';
export const K_NULLABLE = 'nullable';

export const XS_REL_SOURCE_PREFIX = 'source';
export const XS_REL_TARGET_PREFIX = 'target';

export const XS_P_TYPE = 'type';
export const XS_P_REV_ID = 'revId';
export const XS_P_SEQ_NR = 'seqNr';
export const XS_P_PROPERTY = 'property';
export const XS_P_PROPERTY_ID = 'propertyId';
export const XS_P_$LABEL = '$label';
export const __ID__ = 'xs:entity_id';
export const __PROPERTY__ = '__property__';
export const XS_P_PREV_ID = 'prevId';

// export const XS_P_URL = ;
// export const XS_P_LABEL = '_label_';
export const XS_P_ABORTED = '__aborted__';





export const API_ENTITY_PREFIX = '/entity';



/**
 * Metadata
 */

export const _API_CTRL_ENTITY_FIND_ENTITY = `/find/:name`;
export const _API_CTRL_ENTITY_AGGREGATE_ENTITY = `/aggregate/:name`;
export const _API_CTRL_ENTITY_GET_ENTITY = `/get/:name/:id`;
export const _API_CTRL_ENTITY_SAVE_ENTITY = `/save/:name`;
export const _API_CTRL_ENTITY_UPDATE_ENTITY = `/update/:name/:id`;
export const _API_CTRL_ENTITY_UPDATE_BY_CONDITION = `/update/:name`;
export const _API_CTRL_ENTITY_DELETE_ENTITY = `/delete/:name/:id`;
export const _API_CTRL_ENTITY_DELETE_BY_CONDITION = `/delete/:name`;

export const _API_CTRL_ENTITY_METADATA = '/metadata';
export const _API_CTRL_ENTITY_METADATA_ALL_STORES = _API_CTRL_ENTITY_METADATA + '/schemas';
export const _API_CTRL_ENTITY_METADATA_GET_STORE = _API_CTRL_ENTITY_METADATA + '/schema/:name';
export const _API_CTRL_ENTITY_METADATA_ALL_ENTITIES = _API_CTRL_ENTITY_METADATA + '/entities';
export const _API_CTRL_ENTITY_METADATA_CREATE_ENTITY = _API_CTRL_ENTITY_METADATA + '/entity';
export const _API_CTRL_ENTITY_METADATA_GET_ENTITY = _API_CTRL_ENTITY_METADATA + '/entity/:name';

export const API_CTRL_ENTITY_FIND_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_FIND_ENTITY;
export const API_CTRL_ENTITY_AGGREGATE_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_AGGREGATE_ENTITY;
export const API_CTRL_ENTITY_GET_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_GET_ENTITY;
export const API_CTRL_ENTITY_SAVE_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_SAVE_ENTITY;
export const API_CTRL_ENTITY_UPDATE_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_UPDATE_ENTITY;
export const API_CTRL_ENTITY_DELETE_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_DELETE_ENTITY;

export const API_CTRL_ENTITY_METADATA = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA;
export const API_CTRL_ENTITY_METADATA_ALL_STORES = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA_ALL_STORES;
export const API_CTRL_ENTITY_METADATA_GET_STORE = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA_GET_STORE;
export const API_CTRL_ENTITY_METADATA_ALL_ENTITIES = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA_ALL_ENTITIES;
export const API_CTRL_ENTITY_METADATA_CREATE_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA_CREATE_ENTITY;
export const API_CTRL_ENTITY_METADATA_GET_ENTITY = API_ENTITY_PREFIX + _API_CTRL_ENTITY_METADATA_GET_ENTITY;

export const PERMISSION_ALLOW_ACCESS_ENTITY_METADATA = 'allow access entity metadata';

export const PERMISSION_ALLOW_ACCESS_ENTITY = 'allow access entity';
export const PERMISSION_ALLOW_ACCESS_ENTITY_PATTERN = 'allow access entity :name';

export const PERMISSION_ALLOW_CREATE_ENTITY = 'allow create entity';
export const PERMISSION_ALLOW_CREATE_ENTITY_PATTERN = 'allow create entity :name';

export const PERMISSION_ALLOW_UPDATE_ENTITY = 'allow update entity';
export const PERMISSION_ALLOW_UPDATE_ENTITY_PATTERN = 'allow update entity :name';

export const PERMISSION_ALLOW_DELETE_ENTITY = 'allow delete entity';
export const PERMISSION_ALLOW_DELETE_ENTITY_PATTERN = 'allow delete entity :name';

export const XS_ANNOTATION_OPTIONS_CACHE = 'annotation_options_cache';
