export const K_ROUTE_CACHE = 'route_cache';
export const C_DEFAULT = 'default';
export const C_SERVER = 'server';
export const K_CORE_LIB_CONTROLLERS = 'server.controllers';
export const K_META_CONTEXT_ARGS = 'controller.contexts';
export const K_META_PERMISSIONS_ARGS = 'controller.permissions';
export const K_ROUTE_STATIC = 'static_files';
export const K_ROUTE_CONTROLLER = 'routing_controller';
export type ROUTE_TYPE = 'static_files' | 'routing_controller';


export const K_CONFIG_ANONYMOUS_ALLOW = 'config.anonymous.allow';

/**
 * Access key for config key permissions, the logic is
 *
 * config:
 *  permissions:
 *    'key.to.secure':
 *      - 'allow this some stuff'
 */
export const K_CONFIG_PERMISSIONS = 'config.permissions';

export const C_API = 'api';

/**
 * Server status controller links
 */
export const _API_CTRL_SERVER_PING = '/ping';
export const API_CTRL_SERVER_PING = _API_CTRL_SERVER_PING;

export const _API_CTRL_SERVER_STATUS = '/status';
export const API_CTRL_SERVER_STATUS = _API_CTRL_SERVER_STATUS;

// moved from system in 1.0.4 cause this is a server context
// export const PERMISSION_SERVER_ROUTES_VIEW = 'allow routes view';
export const _API_CTRL_SERVER_ROUTES = '/routes';
export const API_CTRL_SERVER_ROUTES = _API_CTRL_SERVER_ROUTES;

export const _API_CTRL_SERVER_CONFIG = '/config';
export const API_CTRL_SERVER_CONFIG = _API_CTRL_SERVER_CONFIG;

export const _API_CTRL_SERVER_CONFIG_KEY = '/config/:key';
export const API_CTRL_SERVER_CONFIG_KEY = _API_CTRL_SERVER_CONFIG_KEY;


/**
 * User
 */
export const DEFAULT_ANONYMOUS = '__DEFAULT_ANONYMOUS__';

/**
 * System
 */
export const _API_CTRL_SYSTEM = '/system';
// export const API_CTRL_SYSTEM = '/api' + _API_CTRL_SYSTEM;


export const PERMISSION_ALLOW_MODULES_VIEW = 'allow modules view';
export const _API_CTRL_SYSTEM_MODULES = '/modules';
export const API_CTRL_SYSTEM_MODULES = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_MODULES;

// export const PERMISSION_ALLOW_GLOBAL_CONFIG_VIEW = 'allow global config view';
// export const _API_CTRL_SYSTEM_CONFIG = '/config';
// export const API_CTRL_SYSTEM_CONFIG = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_CONFIG;

// export const PERMISSION_ALLOW_STORAGES_VIEW = 'allow storages view';
// export const _API_CTRL_SYSTEM_STORAGES = '/storages';
// export const API_CTRL_SYSTEM_STORAGES = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_STORAGES;

export const PERMISSION_ALLOW_RUNTIME_INFO_VIEW = 'allow runtime info view';
export const _API_CTRL_SYSTEM_RUNTIME_INFO = '/info';
export const API_CTRL_SYSTEM_RUNTIME_INFO = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_RUNTIME_INFO;

export const PERMISSION_ALLOW_RUNTIME_NODE_VIEW = 'allow runtime node view';
export const _API_CTRL_SYSTEM_RUNTIME_NODE = '/node';
export const API_CTRL_SYSTEM_RUNTIME_NODE = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_RUNTIME_NODE;

export const PERMISSION_ALLOW_RUNTIME_NODES_VIEW = 'allow runtime nodes view';
export const _API_CTRL_SYSTEM_RUNTIME_NODES = '/nodes';
export const API_CTRL_SYSTEM_RUNTIME_NODES = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_RUNTIME_NODES;

export const PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW = 'allow runtime remote infos view';
export const _API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS = '/remote_infos';
export const API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS;

export const PERMISSION_ALLOW_WORKERS_INFO = 'list worker information';
export const _API_CTRL_SYSTEM_WORKERS = '/workers';
export const API_CTRL_SYSTEM_WORKERS = _API_CTRL_SYSTEM + _API_CTRL_SYSTEM_WORKERS;







export const XS_P_$URL = '$url';
export const XS_P_$LABEL = '$label';



/**
 * File System
 */
export const API_CTRL_FILESYSTEM = '/fs';

export const _API_CTRL_FILESYSTEM_READ = '/read';
export const API_CTRL_FILESYSTEM_READ = API_CTRL_FILESYSTEM + _API_CTRL_FILESYSTEM_READ;

export const PERMISSION_ACCESS_FILES = 'access files';

export const PERMISSION_ACCESS_FILE_PATH = 'access files on :path';


/**
 * Registry constants
 */
export const API_CTRL_REGISTRY = '/registry';

export const PERMISSION_ALLOW_ACCESS_REGISTRY_NAMESPACES = 'allow list registry namespaces';
export const _API_CTRL_REGISTRY_NAMESPACES = '/list/namespaces';
export const API_CTRL_REGISTRY_NAMESPACES = API_CTRL_REGISTRY + _API_CTRL_REGISTRY_NAMESPACES;

export const PERMISSION_ALLOW_ACCESS_REGISTRY_ENTITY_REFS = 'allow access registry entity-refs';
export const PERMISSION_ALLOW_ACCESS_REGISTRY_ENTITY_REFS_BY_NAMESPACE = 'allow access registry :namespace entity-refs';
export const _API_CTRL_REGISTRY_DATA = '/:namespace/entity-refs';
export const API_CTRL_REGISTRY_DATA = API_CTRL_REGISTRY + _API_CTRL_REGISTRY_DATA;

export const PERMISSION_ALLOW_ACCESS_REGISTRY_SCHEMAS = 'allow list registry schemas';
export const _API_CTRL_REGISTRY_SCHEMAS = '/list/schemas';
export const API_CTRL_REGISTRY_SCHEMAS = API_CTRL_REGISTRY + _API_CTRL_REGISTRY_SCHEMAS;

export const _API_CTRL_REGISTRY_SCHEMA = '/:namespace/schema-ref/:schema';
export const API_CTRL_REGISTRY_SCHEMA = API_CTRL_REGISTRY + _API_CTRL_REGISTRY_SCHEMA;

export const _API_CTRL_REGISTRY_ENTITY = '/:namespace/entity-ref/:entity';
export const API_CTRL_REGISTRY_ENTITY = API_CTRL_REGISTRY + _API_CTRL_REGISTRY_ENTITY;
