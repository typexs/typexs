import {orderBy, remove} from 'lodash';
import {Injectable} from '@angular/core';
import {
  API_CTRL_SERVER_CONFIG,
  API_CTRL_SERVER_ROUTES,
  API_CTRL_SYSTEM_MODULES,
  API_CTRL_SYSTEM_RUNTIME_INFO,
  API_CTRL_SYSTEM_RUNTIME_NODE,
  API_CTRL_SYSTEM_RUNTIME_NODES,
  API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS,
  API_CTRL_SYSTEM_STORAGES,
  API_CTRL_SYSTEM_WORKERS,
  IRoute
} from '@typexs/server';
import {IModule, IStorageOptions, ITypexsOptions} from '@typexs/base';
import {SystemNodeInfo} from '@typexs/base/entities/SystemNodeInfo';
import {IWorkerInfo} from '@typexs/base/libs/worker/IWorkerInfo';
import {BehaviorSubject, combineLatest, Observable, Subject} from 'rxjs';
import {NodeRuntimeInfo} from '@typexs/base/libs/system/NodeRuntimeInfo';
import {filter as rFilter} from 'rxjs/operators';
import {BackendService} from '../api/backend/backend.service';


@Injectable()
export class SystemInfoService {

  info$: BehaviorSubject<NodeRuntimeInfo> = new BehaviorSubject<NodeRuntimeInfo>(null);

  infos$: BehaviorSubject<NodeRuntimeInfo[]> = new BehaviorSubject<NodeRuntimeInfo[]>(null);

  node$: BehaviorSubject<SystemNodeInfo> = new BehaviorSubject<SystemNodeInfo>(null);

  nodes$: BehaviorSubject<SystemNodeInfo[]> = new BehaviorSubject<SystemNodeInfo[]>(null);

  allNodes: SystemNodeInfo[] = [];

  nodesCount: number = 0;

  timetable: { [k: string]: number } = {};


  constructor(private backendClientService: BackendService) {
  }


  usedMemoryPercent(info: NodeRuntimeInfo) {
    return Math.round(((info.memory.total - info.memory.free) / info.memory.total * 10000)) / 100;
  }


  memoryScale(i: number) {
    return Math.round(i / 1024 / 1024);
  }


  refresh(): Observable<boolean> {
    const subject = new Subject<boolean>();
    const sub = combineLatest([
      this.getNode().pipe(rFilter(x => !!x)),
      this.getNodes().pipe(rFilter(x => !!x)),
      this.getRuntimeInfo().pipe(rFilter(x => !!x)),
      this.getRuntimeInfos().pipe(rFilter(x => !!x))
    ])
      .subscribe(
        x => {
          subject.next(true);
          subject.complete();
          setTimeout(() => {
            sub.unsubscribe();
          });
        },
        error => {
          subject.next(false);
          subject.complete();
          setTimeout(() => {
            sub.unsubscribe();
          });
        },
        () => {

        }
      );
    return subject.asObservable();
  }


  callRuntimeInfo() {
    return this.getBackendClient().callApi<NodeRuntimeInfo>(API_CTRL_SYSTEM_RUNTIME_INFO);
  }


  callRuntimeInfos() {
    return this.getBackendClient().callApi<NodeRuntimeInfo[]>(API_CTRL_SYSTEM_RUNTIME_REMOTE_INFOS);
  }


  callNodeInfo() {
    return this.getBackendClient().callApi<SystemNodeInfo>(API_CTRL_SYSTEM_RUNTIME_NODE);
  }


  callNodesInfos() {
    return this.getBackendClient().callApi<SystemNodeInfo[]>(API_CTRL_SYSTEM_RUNTIME_NODES);
  }


  getBackendClient() {
    return this.backendClientService;
  }


  private offsetReached(memberName: string) {
    const now = Date.now();
    if (!this.timetable[memberName] || !this[memberName + '$'].getValue()) {
      this.timetable[memberName] = 0;
    }

    if (now - this.timetable[memberName] > 10000) {
      return true;
    }
    return false;
  }


  getNode() {
    if (this.offsetReached('node')) {
      this.callNodeInfo().subscribe((info) => {
        if (info) {
          info.started_at = new Date(info.started_at);
          info.updated_at = new Date(info.updated_at);
          this.node$.next(info);
          info['_active_'] = true;
          remove(this.allNodes, x => x.key === info.key);
          this.allNodes.push(info);
          this.allNodes = orderBy(this.allNodes, ['_active_', 'key'], ['asc', 'asc']);
          this.nodesCount = this.allNodes.length;
        }
      }, error => {
      });
    }
    return this.node$.asObservable();
  }

  getNodeValue() {
    return this.node$.getValue();
  }

  getNodes() {
    if (this.offsetReached('nodes')) {
      this.callNodesInfos().subscribe((info) => {
        if (info) {
          info.map(x => {
            x.started_at = new Date(x.started_at);
            x.updated_at = new Date(x.updated_at);
          });
          this.nodes$.next(info);
          remove(this.allNodes, x => !x['_active_']);
          this.allNodes.push(...info);
          this.allNodes = orderBy(this.allNodes, ['_active_', 'key'], ['asc', 'asc']);
          this.nodesCount = this.allNodes.length;
        }
      }, error => {
      });
    }
    return this.nodes$.asObservable();
  }

  getNodesValue() {
    return this.nodes$.getValue();
  }

  getRuntimeInfo() {
    if (this.offsetReached('runtimeInfo')) {
      this.callRuntimeInfo().subscribe((info) => {
        if (info) {
          this.info$.next(info);
        }
      }, error => {
      });
    }
    return this.info$.asObservable();
  }

  getRuntimeInfoValue() {
    return this.info$.getValue();
  }

  getRuntimeInfos() {
    if (this.offsetReached('runtimeInfos')) {
      this.callRuntimeInfos().subscribe((info) => {
        if (info) {
          this.infos$.next(info);
        }
      }, error => {
      });
    }
    return this.infos$.asObservable();
  }

  getRuntimeInfosValue() {
    return this.infos$.getValue();
  }

  loadRuntimeInfo(callback?: (err: Error, info: NodeRuntimeInfo) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_RUNTIME_INFO, {handle: callback});
  }

  loadRuntimeNode(callback?: (err: Error, node: SystemNodeInfo) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_RUNTIME_NODE, {handle: callback});
  }

  loadRuntimeNodes(callback?: (err: Error, nodes: SystemNodeInfo[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_RUNTIME_NODES, {handle: callback});
  }

  loadModules(callback?: (err: Error, modules: IModule[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_MODULES, {handle: callback});
  }

  loadStorages(callback?: (err: Error, storageOptions: IStorageOptions[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_STORAGES, {handle: callback});
  }

  loadConfig(callback?: (err: Error, config: ITypexsOptions[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SERVER_CONFIG, {handle: callback});
  }

  loadRoutes(callback?: (err: Error, routes: IRoute[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SERVER_ROUTES, {handle: callback});
  }


  loadWorkers(callback?: (err: Error, workerInfos: IWorkerInfo[]) => void) {
    return this.backendClientService.callApi(API_CTRL_SYSTEM_WORKERS, {handle: callback});
  }


}
