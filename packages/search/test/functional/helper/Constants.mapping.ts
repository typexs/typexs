
export const X = {
  'bigint': {
    'type': 'long'
  },
  'bool': {
    'type': 'boolean'
  },
  'date': {
    'type': 'date'
  },
  'dateWithTime': {
    'type': 'date'
  },
  'defaultNumber': {
    'type': 'long'
  },
  'double': {
    'type': 'double'
  },
  'float': {
    'type': 'double'
  },
  'id': {
    'type': 'long'
  },
  'int': {
    'type': 'integer'
  },
  'str': {
    'fields': {
      'keyword': {
        'ignore_above': 256,
        'type': 'keyword'
      }
    },
    'type': 'text'
  }
};


export const Y = {
  'date': {
    'type': 'date'
  },
  'id': {
    'type': 'long'
  },
  'str': {
    'fields': {
      'keyword': {
        'ignore_above': 256,
        'type': 'keyword'
      }
    },
    'type': 'text'
  },
  'ref': {
    properties: X
  }
};
