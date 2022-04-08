import {ComponentRegistry} from '../ComponentRegistry';


export function ViewContent(typeName: string) {
  return function (object: Function) {
    ComponentRegistry.addHandle(typeName, object);
  };
}
