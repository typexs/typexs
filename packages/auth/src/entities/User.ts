import { isBoolean, isString } from '@typexs/generic';


import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity/libs/Constants';
import { And, Eq, Key, Value } from '@allgemein/expressions';
import { RBelongsTo } from '@typexs/roles/entities/RBelongsTo';
import { Readonly } from '@typexs/forms';
import { IAuthUser } from '../libs/models/IAuthUser';
import { Role } from '@typexs/roles/entities/Role';
import { IRolesHolder } from '@typexs/roles-api';
import { Entity, Namespace, Property, Schema } from '@allgemein/schema-api';
import { From, Join, To } from '@typexs/entity/libs/descriptors/JoinDesc';
import { Asc } from '@typexs/entity/libs/descriptors/OrderDesc';

@Namespace(NAMESPACE_BUILT_ENTITY)
@Schema({ name: 'default' })
@Entity()
export class User implements IAuthUser, IRolesHolder {

  @Property({ type: 'number', auto: true })
  id: number;

  @Property({ type: 'string', typeorm: { unique: true } })
  username: string;

  @Property({ type: 'string', typeorm: { unique: true } })
  mail: string;

  @Property({ type: 'string', nullable: true })
  displayName: string;

  @Property({ type: 'boolean' })
  disabled: boolean = false;

  @Property({ type: 'boolean' })
  approved: boolean = false;

  @Property({
    type: 'Role',
    cardinality: 0,
    join:
      Join(RBelongsTo,
        [
          From(Eq('ownerid', Key('id'))),
          To(Eq('id', Key('refid')))
        ],
        And(
          Eq('ownertab', Value('user')),
          Eq('reftab', Value('role'))),
        [Asc(Key('sort')), Asc(Key('id'))])
  })
  roles: Role[];

  @Readonly()
  @Property({ type: 'date:created' })
  created_at: Date;

  @Readonly()
  @Property({ type: 'date:updated' })
  updated_at: Date;

  isApproved(): boolean {
    if (!isBoolean(this.approved)) {
      if (isString(this.approved)) {
        if (this.approved === '0' || this.approved === 'false') {
          this.approved = false;
        } else if (this.approved === '1' || this.approved === 'true') {
          this.approved = true;
        }
      } else {
        this.approved = this.approved ? true : false;
      }
    }
    return this.approved;
  }

  isDisabled(): boolean {
    if (!isBoolean(this.disabled)) {
      if (isString(this.disabled)) {
        if (this.disabled === '0' || this.disabled === 'false') {
          this.disabled = false;
        } else if (this.disabled === '1' || this.disabled === 'true') {
          this.disabled = true;
        }
      } else {
        this.disabled = this.disabled ? true : false;
      }
    }
    return this.disabled;
  }

  label() {
    if (this.displayName) {
      return this.displayName;
    }
    return this.username;
  }


  getIdentifier(): string {
    return this.username;
  }

  getRoles(): Role[] {
    return this.roles;
  }
}
