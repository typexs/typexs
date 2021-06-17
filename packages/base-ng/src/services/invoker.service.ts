import {Injectable} from '@angular/core';
import {Invoker} from '@typexs/base/base/Invoker';
import {ClassType} from '@allgemein/schema-api';


@Injectable()
export class InvokerService {

  private _invoker: Invoker;

  constructor() {
    this._invoker = new Invoker();
  }

  use<T>(type: ClassType<T>): T {
    return this._invoker.use(type);
  }

  getInvoker() {
    return this._invoker;
  }

  register(api: Function, impl: Function | Function[]): void {
    this._invoker.register(api, impl);
  }


  has(api: Function): boolean {
    return this._invoker.has(api);
  }

  hasImpl(api: Function): boolean {
    return this._invoker.hasImpl(api);
  }

}
