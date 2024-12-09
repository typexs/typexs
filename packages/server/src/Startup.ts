import { Config, IBootstrap, Inject } from '@typexs/base';

import { C_SERVER } from './libs/Constants';
import { ServerRegistry } from './libs/server/ServerRegistry';
import { isEmpty } from '@typexs/generic';


export class Startup implements IBootstrap {

  @Inject('ServerRegistry')
  serverRegistry: ServerRegistry;


  async bootstrap(): Promise<void> {
    const data = Config.get(C_SERVER, {});

    if (!isEmpty(data)) {
      await this.serverRegistry.load(data);
    }
  }



}
