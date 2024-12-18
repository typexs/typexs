import { NotYetImplementedError } from '@typexs/base';
import { PropertyRef } from '../registry/PropertyRef';

import { OrderDesc } from './OrderDesc';
import { ConditionValidationError } from '../exceptions/ConditionValidationError';
import { And, ExprDesc, IExpr } from '@allgemein/expressions';
import { IClassRef, METATYPE_CLASS_REF, RegistryFactory } from '@allgemein/schema-api';
import { NAMESPACE_BUILT_ENTITY } from '../Constants';
import { find, isArray, isString } from '@typexs/generic';


export type KeyMapType = 'from' | 'to';

export class KeyMapDesc implements IExpr {
  cond: ExprDesc;
  type: KeyMapType;

  constructor(cond: ExprDesc, type: KeyMapType = 'from') {
    this.cond = cond;
    this.type = type;
  }
}

export class JoinDesc implements IExpr {
  readonly type: string = 'join';

  readonly base: string | Function;
  // readonly joinRef: IClassRef;

  readonly keyMaps: KeyMapDesc[] = [];

  readonly condition: ExprDesc;

  readonly order: OrderDesc[] = [];

  constructor(base: string | Function, keyMaps: KeyMapDesc[], conditions?: ExprDesc, order?: OrderDesc | OrderDesc[]) {
    if (isString(base)) {
      throw new NotYetImplementedError();
    }
    this.base = base;
    this.keyMaps = keyMaps;
    this.condition = conditions;
    if (order) {
      this.order = !isArray(order) ? [order] : order;
    }
  }


  getJoinRef() {
    return RegistryFactory.get(NAMESPACE_BUILT_ENTITY).getClassRefFor(this.base, METATYPE_CLASS_REF);
  }

  getFrom() {
    return find(this.keyMaps, k => k.type === 'from');
  }

  getTo() {
    return find(this.keyMaps, k => k.type === 'to');
  }

  validate(sourceDef: IClassRef, propertyDef: PropertyRef, targetDef: IClassRef, throwing: boolean = true) {
    const registry = sourceDef.getRegistry();
    const joinRef = this.getJoinRef();
    if (this.condition) {
      this.condition.validate(registry, joinRef);
    }
    this.getFrom().cond.validate(registry, joinRef, sourceDef);
    this.getTo().cond.validate(registry, targetDef, joinRef);
    const props = sourceDef.getRegistry().getPropertyRefsFor(joinRef).map(p => p.name);
    this.order.forEach(o => {
      if (props.indexOf(o.key.key) === -1) {
        throw new ConditionValidationError('no property with order key ' + o.key.key + ' found.');
      }
    });
  }

  for(source: any, keyMap: any = {}) {
    if (this.condition) {
      return And(this.getFrom().cond, this.condition).for(source, keyMap);
    }
    return this.getFrom().cond.for(source, keyMap);
  }


  lookup(source: any) {
    if (this.condition) {
      return And(this.getFrom().cond, this.condition).lookup(source);
    }
    return this.getFrom().cond.lookup(source);
  }
}


export function Join(base: string | Function, keyMaps: KeyMapDesc[], conditions?: ExprDesc, order?: OrderDesc | OrderDesc[]) {
  return new JoinDesc(base, keyMaps, conditions, order);
}

export function To(cond: ExprDesc) {
  return new KeyMapDesc(cond, 'to');
}

export function From(cond: ExprDesc) {
  return new KeyMapDesc(cond, 'from');
}
