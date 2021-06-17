import {IUser} from './IUser';

export const ANONYMUS_USER: string = 'anonymus';

export class AnonymusUser implements IUser {

  readonly username: string = ANONYMUS_USER;

}
