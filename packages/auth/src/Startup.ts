import { isEmpty } from '@typexs/generic';


import { Config, IBootstrap, IEntityController, Inject, Injector, Invoker, Log, StorageRef } from '@typexs/base';
import { AuthHelper } from './libs/auth/AuthHelper';
import { AuthManager } from './libs/auth/AuthManager';
import { IConfigUser } from './libs/models/IConfigUser';


export class Startup implements IBootstrap {

  @Inject('storage.default')
  private storageRef: StorageRef;

  @Inject(AuthManager.NAME)
  private authManager: AuthManager;

  @Inject(Invoker.NAME)
  private invoker: Invoker;


  async bootstrap() {

    await this.authManager.prepare();

    const cfgUsers = Config.get('initialise.users', []) as IConfigUser[];

    if (!isEmpty(cfgUsers)) {
      // user are dependent by the adapter + roles mapping
      Log.info('init users');
      const controller: IEntityController = Injector.get('EntityController.default');
      await AuthHelper.initUsers(this.invoker, controller, this.authManager, cfgUsers);
    }

  }

}

