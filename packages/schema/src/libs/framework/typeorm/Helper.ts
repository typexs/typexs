import { IPropertyRef } from '@allgemein/schema-api';
import { first, isArray, isEmpty, isNull } from 'lodash';
import { PROP_KEY_LOOKUP } from './Constants';
import * as _ from 'lodash';

export function setTargetValueForProperty(propertyRef: IPropertyRef, target: any, newObject: any, seqNr: number = null) {
  if (propertyRef.isCollection()) {
    if (isNull(seqNr)) {
      if (isArray(newObject)) {
        target[propertyRef.name] = newObject;
      } else {
        target[propertyRef.name] = [newObject];
      }
    } else {
      if (!isArray(target[propertyRef.name])) {
        target[propertyRef.name] = [];
      }
      target[propertyRef.name][seqNr] = newObject;
    }
  } else {
    if (isArray(newObject)) {
      target[propertyRef.name] = isEmpty(newObject) ? null : first(newObject);
    } else {
      target[propertyRef.name] = newObject;
    }

  }
}


export function setTargetInitialForProperty(propertyRef: IPropertyRef, target: any) {
  if (propertyRef.isCollection()) {
    target[propertyRef.name] = [];
  } else {
    target[propertyRef.name] = null;
  }
}


export function lookupKey(p: IPropertyRef) {
  return [PROP_KEY_LOOKUP, p.name].join('--');
}


export function collectLookupConditions(propertyRef: IPropertyRef, sources: any[]){
  const lookupConditions: any[] = [];
  const LOOKUP_KEY = lookupKey(propertyRef);
  for (const source of sources) {
    if (_.has(source, LOOKUP_KEY)) {
      const lookup = source[LOOKUP_KEY];
      lookupConditions.push(lookup);
      delete source[LOOKUP_KEY];
    }
  }
  return lookupConditions;
}
