import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity/libs/Constants';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class AuthSession {

  @Property({type: 'string', id: true, length: 128})
  token: string;

  @Property({type: 'string', length: 64})
  ip: string;

  @Property()
  userId: number = null;

  @Property({ type: 'string', length: 128 })
  authId: string;

  @Property({nullable: true})
  data: any = null;

  @Property({type: 'date:created'})
  created_at: Date;

  @Property({type: 'date:updated'})
  updated_at: Date;


  // @BeforeInsert()
  // bin() {
  //   if (!_.isString(this.data)) {
  //     this.data = JSON.stringify(this.data);
  //   }
  // }
  //
  // @BeforeUpdate()
  // bup() {
  //   this.bin();
  // }
  //
  //
  // @AfterLoad()
  // load() {
  //   if (_.isString(this.data)) {
  //     this.data = JSON.parse(this.data);
  //   }
  // }
  //
  // @AfterInsert()
  // ain() {
  //   this.load();
  // }
  //
  // @AfterUpdate()
  // aup() {
  //   this.load();
  // }


}
