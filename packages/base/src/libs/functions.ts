import { filter, isFunction } from 'lodash';
import { Log } from './logging/Log';
import { ClassesLoader } from '@allgemein/moduls';

export async function callMethod(
  objects: any[], methodName: string, options: { throwMode: 'log' | 'instantly' } = { throwMode: 'instantly' }) {
  const _objects = filter(objects, a => isFunction(a[methodName]));

  for (const activator of _objects) {
    Log.trace(methodName + ' ' + ClassesLoader.getModulName(activator.constructor));
    try {
      await activator[methodName]();
    } catch (e) {
      if (options?.throwMode === 'instantly') {
        throw e;
      } else {
        Log.error(e);
      }
    }
  }
}
