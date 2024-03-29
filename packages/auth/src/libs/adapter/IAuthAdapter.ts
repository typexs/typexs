import { IAuthOptions } from '../auth/IAuthOptions';
import { AuthLifeCycle } from '../Constants';
import { AbstractUserSignup } from '../models/AbstractUserSignup';
import { AbstractUserLogin } from '../models/AbstractUserLogin';
import { IApplication } from '@typexs/server/libs/server/IApplication';
import { IRequest } from '@typexs/server/libs/server/IRequest';
import { IResponse } from '@typexs/server/libs/server/IResponse';
import { AuthDataContainer } from '../auth/AuthDataContainer';


export type T_AUTH_ADAPTER_STAGE = 'before' | 'after';

/**
 * IAuthAdapter is an interface for handling authentication against other backend systems
 */
export interface IAuthAdapter {

  type: string;

  authId?: string;

  hasRequirements?(): boolean;

  prepare(authOptions: IAuthOptions): void;


  use?(app: IApplication, stage?: T_AUTH_ADAPTER_STAGE): void;

  getModelFor(stage: AuthLifeCycle): Function;

  authenticate(login: AuthDataContainer<AbstractUserLogin>): Promise<boolean> | boolean;

  canCreateOnLogin(): boolean;

  canSignup(): boolean;

  canAutoApprove(): boolean;

  getDefaultRole(): string;

  getOptions(): IAuthOptions;

  signup?(signup: AuthDataContainer<AbstractUserSignup>): Promise<boolean> | boolean;

  createOnLogin?(login: AuthDataContainer<AbstractUserLogin>): boolean;

  handleCallback?(req: IRequest, res: IResponse): void;

  handleRedirect?(req: IRequest, res: IResponse): void;

  /**
   * Add additional information if necessary
   *
   * @param options
   */
  updateOptions?(options: IAuthOptions): void;


}
