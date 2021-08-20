import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity()
export class WithDate {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property()
  dateByImpDate: Date;

  @Property({ type: 'date' })
  dateByType: Date;

  @Property({ type: 'date:created' })
  dateForCreated: Date;

  @Property({ type: 'date:updated' })
  dateForUpdated: Date;

}
