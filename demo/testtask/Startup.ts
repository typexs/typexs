import * as _ from 'lodash';
import { C_STORAGE_DEFAULT, IBootstrap, IEntityController, Inject, StorageRef, XS_P_$COUNT } from '@typexs/base';
import { TypeOrmSimpleItem } from './entities/TypeOrmSimpleItem';
import { BuildSimpleItem } from './entities/BuildSimpleItem';
import { InnerValue } from './entities/InnerValue';
import { BuildDemoEntity } from './entities/BuildDemoEntity';

export class Startup implements IBootstrap {

  @Inject(C_STORAGE_DEFAULT)
  storageRef: StorageRef;

  @Inject('EntityController.default')
  entityController: IEntityController;

  async bootstrap() {

    let results = await this.storageRef.getController().find(TypeOrmSimpleItem, {}, { limit: 1 });
    if (results[XS_P_$COUNT] < 490) {
      const add = [];
      const add2 = [];
      for (const r of _.range(1, 500)) {
        const si = new TypeOrmSimpleItem();
        si.id = r;
        si.start = r * 10;
        si.stop = r * 10 + 6;
        si.text = 'Text ' + r;
        si.name = 'Name ' + r;
        add.push(si);

      }
      await this.storageRef.getController().save(add);
    }


    results = await this.entityController.find(BuildSimpleItem, {}, { limit: 1 }) as any[];
    if (results[XS_P_$COUNT] < 490) {
      const add = [];
      for (const r of _.range(1, 500)) {
        const si = new BuildSimpleItem();
        si.id = r;
        si.start = r * 10;
        si.stop = r * 10 + 6;
        si.text = 'Text ' + r;
        si.name = 'Name ' + r;
        si.inner = new InnerValue();
        si.inner.name = 'inner-' + r;
        si.inner.text = 'testinner-' + r;
        add.push(si);

      }
      await this.entityController.save(add);
    }

    results = await this.entityController.find(BuildDemoEntity, {}, { limit: 1 }) as any[];
    if (results[XS_P_$COUNT] < 490) {
      const add = [];
      for (const r of _.range(1, 500)) {
        const si = new BuildDemoEntity();
        si.someId = r + '';
        si.start = r * 2;
        si.stop = r * 11 + 6;
        si.text = 'T-Data ' + r;
        si.name = 'T-Name ' + r;
        add.push(si);

      }
      await this.entityController.save(add);
    }

  }
}
