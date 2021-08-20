import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';

/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity()
export class WithNumbers {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property({ type: 'bigint' })
  bigNumberValue1: number;

  @Property({ type: 'bignumber' })
  bigNumberValue2: number;

}
