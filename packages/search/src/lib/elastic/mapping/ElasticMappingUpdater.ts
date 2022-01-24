import { Log } from '@typexs/base';
import { Client } from '@elastic/elasticsearch';
import { ElasticMapping } from './ElasticMapping';
import { get, has, keys } from 'lodash';


const K_INDICES_BODY = 'body';
const K_ACKNOWLEDGMENT = 'acknowledged';

/**
 * Used for reading and writing of elastic mapping to the backend
 */
export class ElasticMappingUpdater {

  private client: Client;

  mappings: { [k: string]: ElasticMapping } = {};


  constructor(client: Client) {
    this.client = client;
  }


  async reload(indicies?: string | string[]): Promise<string[]> {
    let q: any = {};
    if (indicies) {
      q.index = indicies;
    }

    const indices = (await this.client.indices.getMapping(q));
    if (has(indices, K_INDICES_BODY)) {
      const mappings = get(indices, K_INDICES_BODY);
      for (const k of keys(mappings)) {
        this.mappings[k] = new ElasticMapping(k);
        this.mappings[k].parse(mappings[k]);
      }
    }
    return keys(this.mappings);
  }


  exists(indicies: string[]){
    return Promise.all(indicies.map(x => this.client.indices.exists({ index: x }).then(y => {return {[x]: y.body}})));
  }


  get(name: string): ElasticMapping {
    return this.mappings[name] ? this.mappings[name] : null;
  }

  async create(mapping: ElasticMapping): Promise<boolean> {
    let result: boolean = false;
    try {
      const createIndexResponse = await this.client.indices.create(mapping.toRequest());
      result = get(createIndexResponse.body, K_ACKNOWLEDGMENT, false);
    } catch (e) {
      Log.error(e);
      result = false;
    }
    return result;
  }

  async update(mapping: ElasticMapping): Promise<boolean> {
    let result = false;
    try {
      const mappingReq = mapping.toRequest();
      mappingReq.body = mappingReq.body.mappings as any;
      const res = await this.client.indices.putMapping(mappingReq);
      result = get(res.body, K_ACKNOWLEDGMENT, false);
    } catch (e) {
      Log.error(e);
      result = false;
    }
    return result;
  }

  async reindex(mapping: ElasticMapping): Promise<boolean> {
    let result = false;
    try {
      const tmpIndex = mapping.name + '_tmp';
      const tmpMapping = mapping.toRequest();
      tmpMapping.index = tmpIndex;
      let stage = 'create';
      let res = await this.client.indices.create(tmpMapping);
      result = get(res.body, K_ACKNOWLEDGMENT, false);
      if (!result) {
        return false;
      }
      result = await this.doReindex(mapping.name, tmpIndex);
      if (!result) {
        return false;
      }
      result = await this.doDeleteIndex(mapping.name);
      res = await this.client.indices.create(mapping.toRequest());
      result = get(res.body, K_ACKNOWLEDGMENT, false);
      if (!result) {
        return false;
      }
      result = await this.doReindex(tmpIndex, mapping.name);
      if (!result) {
        return false;
      }
      result = await this.doDeleteIndex(tmpIndex);
    } catch (e) {
      Log.error(e);
      result = false;
    }
    return result;
  }


  doDeleteIndex(name: string) {
    return this.client.indices.delete({
      index: name
    }).then(x => get(x.body, K_ACKNOWLEDGMENT, false));
  }

  doReindex(from: string, to: string) {
    return this.client.reindex({
      refresh: true,
      body: {
        source: {
          index: from
        },
        dest: {
          index: to
        }
      }
    }).then(x => get(x.body, 'failures', []).length === 0);
  }

}
