import {ComponentRegistry} from '../ComponentRegistry';


export function ViewComponent(typeName: string) {
  return function (object: Function) {
    ComponentRegistry.addComponent(typeName, object);
  };
}
