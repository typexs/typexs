import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({name: 'default'})
@Entity()
export class Driver {
  @Property({ type: 'number', auto: true })
  id: number;


  @Property({type: 'number'})
  age: number;

  @Property({type: 'string'})
  nickName: string;



}
