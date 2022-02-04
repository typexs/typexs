import { isFunction, isString } from 'lodash';
import { IClassRef, IEntityRef, IPropertyRef } from '@allgemein/schema-api';
import { C_$LABEL, C_ENTITY_LABEL, C_LABEL } from '../Constants';


export class LabelHelper {


  static labelForEntity(entity: any, ref: IClassRef | IEntityRef, sep: string = ' ', max: number = 1024): string {
    let labelProperties = ref.getPropertyRefs().filter(x => x.getOptions(C_ENTITY_LABEL, false));
    if (labelProperties.length === 0 && Reflect.has(entity, C_LABEL)) {
      // check if label function or value is present
      if (isFunction(entity[C_LABEL])) {
        return entity.label();
      } else {
        return entity.label;
      }
    } else if (labelProperties.length === 0 && Reflect.has(entity, C_$LABEL)) {
      // check if older label key value is present
      return entity[C_$LABEL];
    } else {
      // take label as value
      const label: string[] = [];
      if (labelProperties.length === 0) {
        // take id as value
        labelProperties = ref.getPropertyRefs().filter(x => x.isIdentifier());
      }

      if (labelProperties.length === 0) {
        // take all values for label
        labelProperties = ref.getPropertyRefs();
      }

      labelProperties.forEach(p => {
        if (!p.isReference()) {
          label.push(p.get(entity));
        }
      });

      const str = label.join(sep);
      if (str.length > max) {
        return str.substring(0, max);
      }
      return str;
    }
  }


  static labelForProperty(property: IPropertyRef): string {
    if (Reflect.has(property, C_LABEL)) {
      if (isFunction(property[C_LABEL])) {
        return property[C_LABEL]();
      } else {
        return property[C_LABEL];
      }
    } else if (property.getOptions(C_LABEL, null)) {
      const value = property.getOptions(C_LABEL, null);
      if (isString(value)) {
        return value;
      }
    }
    return property.name;
  }

}
