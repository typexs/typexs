export const C_TYPEORM = 'typeorm';
export const REGISTRY_TYPEORM = C_TYPEORM;


export const C_BACKUP_TYPE = 'backupType';

export const EVENT_STORAGE_ENTITY_ADDED = 'storage_entity_added';
export const EVENT_STORAGE_ENTITY_REMOVED = 'storage_entity_removed';
export const EVENT_STORAGE_REF_PREPARED = 'storage_ref_init';
export const EVENT_STORAGE_REF_RELOADED = 'storage_ref_reloaded';
export const EVENT_STORAGE_REF_SHUTDOWN = 'storage_ref_shutdown';

export const K_STRINGIFY_OPTION = 'metadata.options.stringify';

export const C_TYPEORM_REGULAR = 'regular';
export const C_TYPEORM_COLUMN = 'column';
export const C_TYPEORM_RELATION = 'relation';
export const C_TYPEORM_EMBEDDED = 'embedded';

export type T_TABLETYPE = 'column' | 'relation' | 'embedded';

export const JS_PRIMATIVE_PROPERTY_TYPES = ['string', 'number', 'boolean', 'date', 'float', 'array'];


export const __TXS__ = '__txs';
export const C_METADATA = 'metadata';
export const C_INTERNAL_NAME = 'internalName';


export type TYPEORM_METADATA_KEYS =
  'tables' |
  'trees' |
  'entityRepositories' |
  'transactionEntityManagers' |
  'transactionRepositories' |
  'namingStrategies' |
  'entitySubscribers' |
  'indices' |
  'uniques' |
  'checks' |
  'exclusions' |
  'columns' |
  'generations' |
  'relations' |
  'joinColumns' |
  'joinTables' |
  'entityListeners' |
  'relationCounts' |
  'relationIds' |
  'embeddeds' |
  'inheritances' |
  'discriminatorValues';

export const typeormMetadataKeys: TYPEORM_METADATA_KEYS[] = [
  'tables',
  'trees',
  'entityRepositories',
  'transactionEntityManagers',
  'transactionRepositories',
  'namingStrategies',
  'entitySubscribers',
  'indices',
  'uniques',
  'checks',
  'exclusions',
  'columns',
  'generations',
  'relations',
  'joinColumns',
  'joinTables',
  'entityListeners',
  'relationCounts',
  'relationIds',
  'embeddeds',
  'inheritances',
  'discriminatorValues'
];
