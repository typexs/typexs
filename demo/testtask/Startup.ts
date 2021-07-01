import * as _ from 'lodash';
import {C_STORAGE_DEFAULT, IBootstrap, Inject, StorageRef, XS_P_$COUNT} from '@typexs/base';
import {SimpleItem} from './entities/SimpleItem';

export class Startup implements IBootstrap {

  @Inject(C_STORAGE_DEFAULT)
  storageRef: StorageRef;

  async bootstrap() {

    const results = await this.storageRef.getController().find(SimpleItem, {}, {limit: 1});
    if (results[XS_P_$COUNT] < 490) {
      const add = [];
      for (const r of _.range(1, 500)) {
        const si = new SimpleItem();
        si.id = r;
        si.start = r * 10;
        si.stop = r * 10 + 6;
        si.text = 'Text ' + r;
        si.name = 'Name ' + r;
        add.push(si);
      }
      await this.storageRef.getController().save(add);
    }


  }
}
