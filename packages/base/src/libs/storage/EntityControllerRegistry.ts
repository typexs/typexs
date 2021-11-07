import { IEntityController } from './IEntityController';
import { ClassRef, ClassType, IClassRef } from '@allgemein/schema-api';
import { first, isEmpty } from 'lodash';

export class EntityControllerRegistry {

  static NAME: string = EntityControllerRegistry.name;

  private entityControllers: IEntityController[] = [];

  add(e: IEntityController) {
    this.entityControllers.unshift(e);
  }

  getControllerForClass(cls: string | ClassType<any> | Function | IClassRef, hint?: { className?: string; name?: string }) {
    const controllers = this.entityControllers.filter(x => !!x.forClass(cls));
    let found = null;
    if (controllers.length > 1) {

      if (!isEmpty(hint)) {
        if (hint.className) {
          found = controllers.find(x => ClassRef.getClassName(x as any) === hint.className);
        }

        if (!found && hint.name) {
          found = controllers.find(x => x.name() === hint.name);
        }
      }

      if (!found) {
        found = first(controllers);
      }
    } else if (controllers.length === 1) {
      found = first(controllers);
    }
    return found;
  }

  get(name: string) {
    return this.getControllers().find(x => x.name() === name);
  }

  getControllers() {
    return this.entityControllers;
  }

}
