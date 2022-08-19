import {
  assign,
  clone,
  defaults,
  get,
  has,
  isEmpty,
  isFunction,
  isNull,
  isObject,
  isPlainObject,
  isString,
  isUndefined,
  remove,
  snakeCase
} from 'lodash';
import {
  AbstractRef,
  ClassRef,
  IBuildOptions,
  IClassRef,
  IEntityRef,
  ILookupRegistry,
  ISchemaRef,
  JsonSchema,
  METADATA_TYPE,
  METATYPE_ENTITY,
  METATYPE_PROPERTY,
  RegistryFactory,
  SchemaUtils
} from '@allgemein/schema-api';
import {
  C_NAME,
  C_NAMESPACE,
  C_TASKS,
  K_TASK_CLASS_NAME, K_TASK_DESCRIPTION, K_TASK_GROUPS,
  K_TASK_NAME, K_TASK_NODE_INFOS, K_TASK_PERMISSIONS, K_TASK_REMOTE,
  K_TASK_TYPE, TaskRefType,
  XS_TYPE_BINDING_TASK_DEPENDS_ON,
  XS_TYPE_BINDING_TASK_GROUP
} from './Constants';
import { NotSupportedError, NotYetImplementedError } from '@allgemein/base';
import { TaskExchangeRef } from './TaskExchangeRef';
import { ITaskRefOptions } from './ITaskRefOptions';
import { ITaskInfo } from './ITaskInfo';
import { Injector } from '../di/Injector';
import { ITaskRefNodeInfo } from './ITaskRefNodeInfo';
import { Binding } from '@allgemein/schema-api/lib/registry/Binding';
import { isClassRef } from '@allgemein/schema-api/api/IClassRef';
import { ITaskPropertyRefOptions } from './ITaskPropertyRefOptions';
import { Log } from '../logging/Log';


/**
 * Descriptor for task functionality and location
 */
export class TaskRef extends AbstractRef implements IEntityRef {


  $source: any;


  constructor(name: string | object | Function, fn: object | Function = null, options: ITaskRefOptions = null) {
    super(METATYPE_ENTITY,
      TaskRef.getTaskName(name),
      TaskRef.getTaskObject(name, fn),
      get(options, C_NAMESPACE, C_TASKS)
    );
    this.setOptions(defaults(options || {}, {
      [K_TASK_PERMISSIONS]: [],
      [K_TASK_NODE_INFOS]: [],
      [K_TASK_GROUPS]: [],
      remote: false
    }));
    const opts = this.getOptions();
    if (!opts[K_TASK_NAME]) {
      this.setOption(K_TASK_NAME, TaskRef.getTaskName(name));
    }
    if (!opts[K_TASK_CLASS_NAME]) {
      this.setOption(K_TASK_CLASS_NAME, this.getClassRef().name);
    }
    this.prepare(name, fn);
  }


  get _type(): TaskRefType {
    return this.getOptions(K_TASK_TYPE, null);
  }

  set _type(type: TaskRefType) {
    this.setOption(K_TASK_TYPE, type);
  }

  get permissions(): string[] {
    if (!this.hasOption(K_TASK_PERMISSIONS)) {
      return null;
    }
    return this.getOptions(K_TASK_PERMISSIONS);
  }

  set permissions(value: string[]) {
    this.setOption(K_TASK_PERMISSIONS, value);
  }

  get description(): string {
    return this.getOptions(K_TASK_DESCRIPTION, null);
  }

  set description(value: string) {
    this.setOption(K_TASK_DESCRIPTION, value);
  }

  get nodeInfos(): ITaskRefNodeInfo[] {
    if (!this.hasOption(K_TASK_NODE_INFOS)) {
      this.setOption(K_TASK_NODE_INFOS, []);
    }
    return this.getOptions(K_TASK_NODE_INFOS);
  }

  set nodeInfos(nodes: ITaskRefNodeInfo[]) {
    this.setOption(K_TASK_NODE_INFOS, nodes);
  }


  static getTaskName(x: string | Function | object) {
    if (isString(x)) {
      return x;
    } else if (isFunction(x)) {
      const i = Reflect.construct(x, []);
      if (i.name) {
        return i.name;
      } else {
        return snakeCase(ClassRef.getClassName(x));
      }
    } else if (isPlainObject(x)) {
      if (has(x, C_NAME)) {
        return get(x, C_NAME);
      }
    } else if (isObject(x) && x[C_NAME]) {
      return x[C_NAME];
    }
    throw new NotSupportedError('can\'t find task name of ' + JSON.stringify(x));
  }


  static getTaskObject(name: string | Function | object, fn: Function | object): Function {
    if (isString(name)) {
      if (isNull(fn)) {
        // return anonymus dummy function
        return SchemaUtils.clazz(name);
      }
      return isFunction(fn) ? fn : fn.constructor;
    } else {
      return isFunction(name) ? name : isFunction(name.constructor) ? name.constructor : isFunction(fn) ? fn : fn.constructor;
    }
  }


  static dependsOn(src: string, dest: string, namespace: string = C_TASKS) {
    const registry = RegistryFactory.get(namespace);
    const f = registry.find(<any>XS_TYPE_BINDING_TASK_DEPENDS_ON, (a: Binding) => (a.source === src && a.target === dest));

    if (!f) {
      const b = new Binding();
      b.bindingType = <any>XS_TYPE_BINDING_TASK_DEPENDS_ON;
      b.sourceType = METATYPE_ENTITY;
      b.source = src;
      b.targetType = METATYPE_ENTITY;
      b.target = dest;
      registry.add(<any>XS_TYPE_BINDING_TASK_DEPENDS_ON, b);
    }
  }


  static group(src: string, dest: string, namespace: string = C_TASKS) {
    const registry = RegistryFactory.get(namespace);
    const f = registry.find(<any>XS_TYPE_BINDING_TASK_GROUP, (a: Binding) => (a.source === src && a.target === dest));

    if (!f) {
      const b = new Binding();
      b.bindingType = <any>XS_TYPE_BINDING_TASK_GROUP;
      b.sourceType = METATYPE_ENTITY;
      b.source = src;
      b.targetType = METATYPE_ENTITY;
      b.target = dest;
      registry.add(<any>XS_TYPE_BINDING_TASK_GROUP, b);
    }
    return this;
  }


  prepare(name: string | object | Function, fn: object | Function = null) {
    const options = this.getOptions();

    if (!this.isRemote()) {
      this.$source = null;

      if (isString(name)) {
        this._type = TaskRefType.CALLBACK;

        if (isFunction(fn)) {
          if (!isEmpty(fn.name)) {
            this._type = TaskRefType.CLASS;
            const x = Reflect.construct(fn, []);
            this.process(x);
            this.$fn = fn;
          } else {
            this.$fn = fn ? fn : function(done: Function) {
              done();
            };
          }

        } else if (isObject(fn)) {
          this._type = TaskRefType.INSTANCE;
          this.process(fn);
          this.$fn = fn;
        }

      } else if (isFunction(name)) {
        this._type = TaskRefType.CLASS;
        const x = Reflect.construct(name, []);
        this.process(x);
        this.$fn = name;
      } else if (isObject(name)) {
        this._type = TaskRefType.INSTANCE;
        this.process(name);
        this.$fn = name;
      } else {
        throw new Error('taskRef wrong defined ' + name + ' ' + fn);
      }

      if (options && options.group) {
        this._type = TaskRefType.GROUP;
      }

      if (options && isUndefined(options['source'])) {
        this.$source = options['source'];
      }
    } else {
      this._type = TaskRefType.REMOTE;
      this.$source = <ITaskInfo>name;
    }

  }

  $fn: Function | object = function(done: Function) {
    done();
  };


  getFn() {
    if (!this.isRemote()) {
      return this.$fn;
    } else {
      return this.$source;
    }
  }


  clone(name: string) {
    let opts: any;
    let tr: any;
    let fn: any;
    let source: any;

    switch (this.getType()) {

      case TaskRefType.REMOTE:
        source = clone(this.$source);
        source.name = name;

        tr = new TaskRef(source);
        tr.nodeInfos = clone(this.nodeInfos);
        return tr;

      case TaskRefType.GROUP:
        opts = clone(this.getOptions());
        tr = new TaskRef(name, null, opts);
        this.grouping().forEach(x => {
          TaskRef.group(name, x, this.namespace);
        });
        tr.nodeInfos = clone(this.nodeInfos);
        return tr;

      default:
        fn = this.getFn();
        opts = clone(this.getOptions());
        tr = new TaskRef(name, fn, opts);
        tr.nodeInfos = clone(this.nodeInfos);
        this.dependencies().forEach(d => {
          tr.dependsOn(d);
        });
        return tr;
    }
  }


  hasTargetNodeId(nodeId: string, withWorker: boolean = false) {
    if (withWorker) {
      return !!this.nodeInfos.find(x => x.nodeId === nodeId && x.hasWorker === withWorker);
    }
    return !!this.nodeInfos.find(x => x.nodeId === nodeId);
  }


  addNodeId(nodeId: string, hasWorker: boolean = false) {
    if (nodeId) {
      this.removeNodeId(nodeId);
      this.nodeInfos.push({ nodeId: nodeId, hasWorker: hasWorker });
    }
  }

  removeNodeId(nodeId: string) {
    remove(this.nodeInfos, x => x.nodeId === nodeId);
  }

  hasWorker() {
    return !!this.nodeInfos.find(x => x.hasWorker === true);
  }

  hasNodeIds() {
    return this.nodeInfos.length > 0;
  }

  isRemote(): boolean {
    return this.getOptions(K_TASK_REMOTE, false);
  }

  private process(obj: any) {
    this.processGroup(obj);
    if (obj[K_TASK_DESCRIPTION]) {
      this.description = obj[K_TASK_DESCRIPTION];
    }
    if (obj[K_TASK_PERMISSIONS]) {
      this.permissions = obj[K_TASK_PERMISSIONS];
    }
  }

  private processGroup(obj: any) {
    if (obj[K_TASK_GROUPS]) {
      for (const group of obj[K_TASK_GROUPS]) {
        this.group(group);
      }
    }
  }


  getType() {
    return this._type;
  }


  canHaveProperties() {
    return this._type === TaskRefType.CLASS || this._type === TaskRefType.INSTANCE;
  }


  toJsonSchema(withProperties: boolean = true) {
    const json = JsonSchema.serialize(this, {
      namespace: this.namespace,
      allowKeyOverride: true,
      ignoreUnknownType: true,
      onlyDecorated: true,
      allowedProperty: (entry: ITaskPropertyRefOptions | string, klass?: any) => {
        if (entry instanceof TaskExchangeRef) {
          const propertyType = entry.getPropertyType();
          if (propertyType === 'runtime') {
            return false;
          }
          return true;
        }
        return false;
      }
    });
    return json;
  }


  executable(incoming: { [k: string]: any } = {}): [Function | object, any] {
    let instance;
    switch (this.getType()) {
      case TaskRefType.CLASS:
        instance = this.create();
        assign(instance, incoming);
        return [instance['exec'].bind(instance), instance];

      case TaskRefType.INSTANCE:
        assign(this.$fn, incoming);
        return [this.$fn['exec'].bind(this.$fn), this.$fn];

      case TaskRefType.CALLBACK:
        assign(this.$fn, incoming);
        return [this.$fn, this.$fn];

      case TaskRefType.GROUP:
        assign(this.$fn, incoming);
        return [this.$fn, this.$fn];

      case TaskRefType.REMOTE:
        return null;
    }
  }


  subtasks() {
    return this.getRegistry().filter(<any>XS_TYPE_BINDING_TASK_GROUP,
      (b: Binding) => b.source === this.name).map((b: Binding) => b.target);
  }


  groups() {
    return this.getRegistry().filter(<any>XS_TYPE_BINDING_TASK_GROUP,
      (b: Binding) => b.target === this.name).map((b: Binding) => b.source);
  }

  grouping() {
    return this.getRegistry().filter(<any>XS_TYPE_BINDING_TASK_GROUP,
      (b: Binding) => b.source === this.name).map((b: Binding) => b.target);
  }

  dependencies(): string[] {
    return this.getRegistry().filter(<any>XS_TYPE_BINDING_TASK_DEPENDS_ON,
      (b: Binding) => b.target === this.name).map((b: Binding) => b.source);
  }


  dependsOn(dest: string) {
    TaskRef.dependsOn(dest, this.name, this.namespace);
    return this;
  }


  group(name: string) {
    TaskRef.group(name, this.name, this.namespace);
    return this;
  }


  id(): string {
    return snakeCase(this.name.toLowerCase());
  }


  build<T>(instance: any, options?: IBuildOptions): T {
    throw new NotYetImplementedError();
  }


  create<T>(): T {
    return Injector.create(this.object.getClass());
  }

  isOf(instance: any): boolean {
    throw new NotSupportedError('isOf is not supported');
  }


  getPropertyRef(name: string): TaskExchangeRef {
    return this.getPropertyRefs().find(x => x.name === name);
  }


  getPropertyRefs(): TaskExchangeRef[] {
    return this.getRegistry().getPropertyRefs(this) as TaskExchangeRef[];
  }


  getIncomings(): TaskExchangeRef[] {
    return this.getPropertyRefs().filter((x: TaskExchangeRef) => (x instanceof TaskExchangeRef) && x.getPropertyType() === 'incoming');
  }


  getOutgoings(): TaskExchangeRef[] {
    return this.getPropertyRefs().filter((x: TaskExchangeRef) => (x instanceof TaskExchangeRef) && x.getPropertyType() === 'outgoing');
  }


  getRuntime(): TaskExchangeRef {
    return this.getPropertyRefs().find((x: TaskExchangeRef) => (x instanceof TaskExchangeRef) && x.getPropertyType() === 'runtime');
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

  /**
   * TODO implement
   * @param object
   * @param type
   */
  getRegistry(): ILookupRegistry {
    return RegistryFactory.get(this.namespace);
  }

  /**
   * Not ne
   * @param object
   * @param type
   */
  getSchemaRefs(): ISchemaRef[] {
    throw new NotSupportedError('getSchemaRefs not supported');
  }


}


