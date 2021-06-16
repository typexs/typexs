import {IPermissionDef} from './IPermissionDef';

export class BasicPermission implements IPermissionDef {

  permission: string;

  type: 'single' | 'pattern' = 'single';

  constructor(permission: string, type?: 'single' | 'pattern') {
    this.permission = permission;
    if (type) {
      this.type = type;
    } else {
      if (/\*/.test(this.permission)) {
        this.type = 'pattern';
      } else {
        this.type = 'single';
      }
    }
  }


}
