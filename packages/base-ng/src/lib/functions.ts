import { TreeUtils } from '@allgemein/base';
import { isString, uniq } from 'lodash';

export function resolveNamespaces(jsonSchema: any) {
  const namespaces: string[] = [];
  TreeUtils.walk(jsonSchema, (x) => {
    if (x.key === 'namespace' && x.parent['type'] === 'object' && isString(x.value)) {
      namespaces.push(x.value);
    }
  });
  return uniq(namespaces);
}
