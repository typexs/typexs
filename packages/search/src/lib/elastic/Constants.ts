import { __ID__, __TYPE__, ES_ALLFIELD, ES_LABELFIELD } from '../Constants';

export type ELASTIC_TYPES =
  'binary' | 'boolean' | 'text' |
  'date' | 'date_nanos' |
  'keyword' | 'constant_keyword' | 'wildcard' |
  'long' | 'double' | 'integer' | 'short' | 'byte' | 'half_float' | 'scaled_float' | 'unsigned_long' |
  'object' | 'flattened' | 'nested' | 'join';




export const DEFAULT_TEXT_MAPPING = {
  'type': 'text',
  'fields': {
    'keyword': {
      'type': 'keyword',
      'ignore_above': 256
    }
  }
};


export const BASE_MAPPING_DYNAMIC_STRUCTURE = [
  {
    strings: {
      'match_mapping_type': 'string',
      'mapping': {
        ...DEFAULT_TEXT_MAPPING,
        copy_to: [ES_ALLFIELD]
      }
    }
  },
  {
    longs: {
      'match_mapping_type': 'long',
      'mapping': {
        'type': 'long',
        copy_to: [ES_ALLFIELD]
      }
    }
  }
];

export const BASE_MAPPING_PROPERTIES_STRUCTURE = {
  [__ID__]: {
    ...DEFAULT_TEXT_MAPPING,
    copy_to: [ES_ALLFIELD]
  },
  [__TYPE__]: {
    ...DEFAULT_TEXT_MAPPING,
    copy_to: [ES_ALLFIELD]
  },
  [ES_LABELFIELD]: {
    ...DEFAULT_TEXT_MAPPING,
    copy_to: [ES_ALLFIELD]
  },
  [ES_ALLFIELD]: {
    ...DEFAULT_TEXT_MAPPING
  }
};

export const BASE_MAPPING_STRUCTURE = {
  dynamic_templates: BASE_MAPPING_DYNAMIC_STRUCTURE,
  properties: BASE_MAPPING_PROPERTIES_STRUCTURE
};
