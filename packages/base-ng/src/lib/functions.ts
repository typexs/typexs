import { TreeUtils } from '@allgemein/base';
import { isString, uniq } from 'lodash';

export function resolveNamespaces(jsonSchema: any) {
  const namespaces: string[] = [];
  TreeUtils.walk(jsonSchema, (x) => {
    if (x.key === 'namespace' && x.parent['type'] === 'object' && typeof x.value === 'string') {
      namespaces.push(x.value);
    }
  });
  return uniq(namespaces);
}


export function convertStringToNumber(value: number | string): number {
  if (typeof value === 'string') {
    if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    } else {
      value = undefined;
    }
  }
  return value as number;
}
