import {Asc, Entity, From, Join, Property, To} from '@typexs/entity';
import {And, Eq, Key, Value} from '@allgemein/expressions';
import {RBelongsTo} from './RBelongsTo';
import {Permission} from './Permission';
import {IRole} from '@typexs/roles-api';


@Entity()
export class Role implements IRole {

  @Property({type: 'number', auto: true})
  id: number;

  @Property({type: 'string', typeorm: {unique: true}})
  rolename: string;


  /**
   * Impl. of IRole
   */
  get role() {
    return this.rolename;
  }

  set role(x: string) {
    this.rolename = x;
  }

  get label() {
    if (this.displayName) {
      return this.displayName;
    }
    return this.rolename;
  }

  set label(x: string) {
    this.displayName = x;
  }


  @Property({type: 'string', nullable: true})
  displayName: string;

  @Property({type: 'string', nullable: true})
  description: string;

  @Property({type: 'boolean'})
  disabled: boolean = false;

  @Property({
    type: 'Permission', cardinality: 0,
    join: Join(RBelongsTo, [
        From(Eq('ownerid', Key('id'))),
        To(Eq('id', Key('refid')))
      ],
      And(
        Eq('ownertab', Value('role')),
        Eq('reftab', Value('permission'))),
      [Asc(Key('sort')), Asc(Key('id'))])
  })
  permissions: Permission[];

  // @FormReadonly() TODO commons-form-decorators
  @Property({type: 'date:created'})
  created_at: Date;

  // @FormReadonly() TODO commons-form-decorators
  @Property({type: 'date:updated'})
  updated_at: Date;


}
