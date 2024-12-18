import {
  AbstractRef,
  ClassRef,
  IClassRef,
  ILookupRegistry,
  IMinMax,
  IPropertyRef,
  METADATA_TYPE,
  METATYPE_PROPERTY,
  RegistryFactory
} from '@allgemein/schema-api';
import { C_TASKS, K_EXCHANGE_REF_TYPE, TASK_PROPERTY_TYPE } from './Constants';
import { NotYetImplementedError } from '@allgemein/base';
import { ITaskPropertyRefOptions } from './ITaskPropertyRefOptions';
import { isClassRef } from '@allgemein/schema-api/api/IClassRef';
import { defaults, get, has, isFunction, isNumber } from '@typexs/generic';


export class TaskExchangeRef extends AbstractRef implements IPropertyRef {

  cardinality: IMinMax | number = 1;

  targetRef: IClassRef;

  constructor(desc: ITaskPropertyRefOptions) {
    super(METATYPE_PROPERTY, desc.propertyName, desc.target, get(desc, 'namespace', C_TASKS));
    this.setOptions(defaults(desc || {}, {type: 'object'}));
    // if (desc.propertyType) {
    //   this.setOption(K_EXCHANGE_REF_TYPE, desc.propertyType);
    // }

    let ret = this.getType();
    if (isFunction(ret)) {
      ret = ClassRef.getClassName(ret);
    }

    if (!['string', 'number', 'boolean', 'date', 'float', 'array', 'object'].includes(ret.toLowerCase())) {
      this.targetRef = this.getClassRefFor(this.getType(), METATYPE_PROPERTY);
    }

    this.cardinality = has(desc, 'cardinality') ? desc.cardinality : 1;

  }

  isPattern(): boolean {
    throw new Error('Method not implemented.');
  }

  isAppended(): boolean {
    throw new Error('Method not implemented.');
  }

  isOptional(): boolean {
    return this.getOptions('optional', false);
  }

  /**
   * Check if the option is set
   *
   * TODO move to @allgemein/schema-api
   *
   * @param name
   */
  hasOption(name: string) {
    const opts = this.getOptions();
    return has(opts, name);
  }

  /**
   * Return the property specific customized value
   *
   * @param value
   */
  async convert(value: any): Promise<any> {
    const opts = this.getOptions();
    if (opts && opts.handle) {
      return await opts.handle(value);
    }
    return value;
  }

  get(instance: any): any {
    throw new NotYetImplementedError();
  }

  /**
   * Return
   */
  getTargetRef(): IClassRef {
    return this.getTargetRef();
  }

  /**
   * Returns the propertyType of property runtime, incoming or outgoing
   */
  getPropertyType(): TASK_PROPERTY_TYPE {
    return this.getOptions(K_EXCHANGE_REF_TYPE);
  }

  getType(): string {
    return this.getOptions('type');
  }

  id(): string {
    return this.machineName;
  }

  isCollection(): boolean {
    const cardinality = this.getOptions('cardinality');
    return isNumber(cardinality) && (cardinality === 0 || cardinality > 1);
  }


  isIdentifier(): boolean {
    return false;
  }

  isReference(): boolean {
    return !!this.targetRef;
  }

  label(): string {
    throw new NotYetImplementedError();
  }

  /**
   * Return a class ref for passing string, Function or class ref
   *
   * @param object
   * @param type
   */
  getClassRefFor(object: string | Function | IClassRef, type: METADATA_TYPE): IClassRef {
    if (isClassRef(object)) {
      return object;
    }
    return ClassRef.get(object as string | Function, this.namespace, type === METATYPE_PROPERTY);
  }

  getRegistry(): ILookupRegistry {
    return RegistryFactory.get(this.namespace);
  }

}
