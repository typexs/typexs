import { Entity, Namespace, Property } from '@allgemein/schema-api';
import { REGISTRY_TYPEORM } from '../../../../../../../src/libs/storage/framework/typeorm/Constants';
/**
 * Using schema api
 */
@Namespace(REGISTRY_TYPEORM)
@Entity()
export class WithJson {

  @Property({ identifier: true, generated: true })
  id: number;

  @Property({ type: 'json' })
  jsonByDefJson: any;

  @Property()
  jsonByImpObj: object;

  @Property()
  jsonByImpAny: any;

  @Property({type: 'object'})
  jsonByDefObj: any;

}
