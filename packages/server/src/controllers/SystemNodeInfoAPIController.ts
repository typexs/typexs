import * as _ from 'lodash';
import {
  C_CONFIG_FILTER_KEYS,
  ClassLoader,
  IModule,
  Inject,
  Injector,
  Invoker,
  IWorkerInfo,
  RuntimeLoader,
  Storage,
  System,
  Workers
} from '@typexs/base';
import {Get, JsonController, Param, QueryParam} from 'routing-controllers';
import {getMetadataArgsStorage as ormMetadataArgsStorage} from 'typeorm';
import {
  _API_CTRL_SYSTEM,
  _API_CTRL_SYSTEM_MODULES,
  _API_CTRL_SYSTEM_RUNTIME_INFO,
  _API_CTRL_SYSTEM_RUNTIME_NODE,
  _API_CTRL_SYSTEM_RUNTIME_NODES,
  _API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS,
  _API_CTRL_SYSTEM_WORKERS,
  C_API,
  PERMISSION_ALLOW_MODULES_VIEW,
  PERMISSION_ALLOW_RUNTIME_INFO_VIEW,
  PERMISSION_ALLOW_RUNTIME_NODE_VIEW,
  PERMISSION_ALLOW_RUNTIME_NODES_VIEW,
  PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW,
  PERMISSION_ALLOW_WORKERS_INFO
} from '../libs/Constants';
import {SystemNodeInfoApi} from '../api/SystemNodeInfo.api';
import {TreeUtils} from '@allgemein/base';
import {ContextGroup} from '../decorators/ContextGroup';
import {Access} from '../decorators/Access';
import {ServerStatusApi} from '../api/ServerStatus.api';
import {WalkValues} from '../libs/Helper';

@ContextGroup(C_API)
@JsonController(_API_CTRL_SYSTEM)
export class SystemNodeInfoAPIController {

  @Inject(System.NAME)
  system: System;

  @Inject(RuntimeLoader.NAME)
  loader: RuntimeLoader;


  @Inject(Storage.NAME)
  storage: Storage;

  @Inject(Invoker.NAME)
  invoker: Invoker;


  @Access(PERMISSION_ALLOW_RUNTIME_INFO_VIEW)
  @Get(_API_CTRL_SYSTEM_RUNTIME_INFO)
  info(): any {
    return this.system.info;
  }


  @Access(PERMISSION_ALLOW_RUNTIME_NODE_VIEW)
  @Get(_API_CTRL_SYSTEM_RUNTIME_NODE)
  node(): any {
    return this.system.node;
  }


  @Access(PERMISSION_ALLOW_RUNTIME_NODES_VIEW)
  @Get(_API_CTRL_SYSTEM_RUNTIME_NODES)
  nodes(): any {
    return this.system.nodes;
  }


  @Access(PERMISSION_ALLOW_RUNTIME_REMOTE_INFOS_VIEW)
  @Get(_API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS)
  nodesInfo(@QueryParam('nodeIds') nodeIds: string[] = []): any {
    return this.system.getNodeInfos(nodeIds);
  }


  // TODO impl worker statistics
  @Access(PERMISSION_ALLOW_WORKERS_INFO)
  @Get(_API_CTRL_SYSTEM_WORKERS)
  listWorkers(): IWorkerInfo[] {
    return (<Workers>Injector.get(Workers.NAME)).infos();
  }


  @Access(PERMISSION_ALLOW_MODULES_VIEW)
  @Get(_API_CTRL_SYSTEM_MODULES)
  listModules(): IModule[] {
    const modules = this.loader.registry.getModules();
    this.invoker.use(SystemNodeInfoApi).prepareModules(modules);
    return modules;
  }





}
