import { get, isBoolean, isEmpty, set } from '@typexs/generic';


import { DataContainer } from '@allgemein/schema-api';
import { EntityRegistry } from '@typexs/entity/libs/EntityRegistry';

export const STATE_KEY = '$state';

export class AuthDataContainer<T> extends DataContainer<T> {

  // authId: string;

  isAuthenticated?: boolean = false;

  success: boolean = false;

  method?: any;

  token?: string;

  user?: any;

  data?: any;

  constructor(instance: T) {
    super(instance, EntityRegistry.$());
  }


  applyState(): void {
    super.applyState();

    ['isAuthenticated', 'success', 'method', 'token', 'user', 'data'].forEach(k => {
      const value = get(this, k, null);
      if (isBoolean(value) || !isEmpty(value)) {
        set(<any>this.instance, [STATE_KEY, k].join('.'), value);
      }
    });

  }

}
