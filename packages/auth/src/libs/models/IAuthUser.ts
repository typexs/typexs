import { IUser } from '@typexs/base';

export interface IAuthUser extends IUser {

  id?: number;

  disabled?: boolean;

  approved?: boolean;

}
