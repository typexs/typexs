import { AbstractExchange } from '../../../libs/messaging/AbstractExchange';
import { ConfigRequest } from './ConfigRequest';
import { ConfigResponse } from './ConfigResponse';
import { IMessageOptions } from '../../../libs/messaging/IMessageOptions';
import { ConfigUtils } from '../../../libs/utils/ConfigUtils';
import { isEmpty } from '@typexs/generic';


export class ConfigExchange extends AbstractExchange<ConfigRequest, ConfigResponse> {

  constructor() {
    super(ConfigRequest, ConfigResponse);
  }


  async key(key: string, opts: IMessageOptions = {}) {
    const r = new ConfigRequest();
    r.key = key;
    const msg = this.create(opts);
    return await msg.send(r);
  }


  handleRequest(request: ConfigRequest, res: ConfigResponse) {
    let _orgCfg: any = {};
    if (!isEmpty(request) && !isEmpty(request.key)) {
      _orgCfg = ConfigUtils.clone(request.key);
    } else {
      _orgCfg = ConfigUtils.clone();
    }
    res.value = _orgCfg;
  }


  handleResponse(responses: ConfigResponse): any {
    return responses.value;
  }
}


