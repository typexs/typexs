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

  /**
   * Index to mapping
   */
  mappings: { [k: string]: ElasticMapping } = {};


  constructor(client: Client) {
    this.client = client;
  }


  async reload(indicies?: string | string[]): Promise<string[]> {
    const q: any = {};
    if (indicies) {
      q.index = indicies;
    }

    const indices = (await this.client.indices.getMapping(q));
    if (has(indices, K_INDICES_BODY)) {
      const mappings = get(indices, K_INDICES_BODY);
      for (const k of  Object.keys(mappings)) {
        this.mappings[k] = new ElasticMapping(k, { skipGenerated: true });
        this.mappings[k].parse(mappings[k]);
      }
    }
    return  Object.keys(this.mappings);
  }


  exists(indicies: string[]) {
    return Promise.all(indicies.map(x => this.client.indices.exists({ index: x }).then(y => ({ [x]: y.body }))));
  }

  doExists(index: string) {
    return this.client.indices.exists({ index: index }).then(y => y.body);
  }


  getBy(name: string, mode: 'alias' | 'name' | 'both' = 'both'): ElasticMapping {
    for (const k of  Object.keys(this.mappings)) {
      if ((mode === 'both' && (this.mappings[k].aliasName === name || this.mappings[k].indexName === name))) {
        return this.mappings[k];
      } else if ((mode === 'name' && this.mappings[k].indexName === name)) {
        return this.mappings[k];
      } else if ((mode === 'alias' && this.mappings[k].aliasName === name)) {
        return this.mappings[k];
      }
    }
    return null;
  }

  async create(mapping: ElasticMapping, options: { skipAlias: boolean; removeCollidingIndex: boolean } = {
    skipAlias: false,
    removeCollidingIndex: true
  }): Promise<boolean> {
    let result: boolean = false;
    try {
      result = await this.doCreateIndex(mapping.toRequest());
      if (result && !options.skipAlias) {
        result = await this.doExists(mapping.aliasName);
        if (result && options.removeCollidingIndex) {
          // remove index with this name
          result = await this.doDeleteIndex(mapping.aliasName);
        }
        result = await this.doAliasExists(mapping.indexName, mapping.aliasName);
        if (!result) {
          result = await this.doAddAlias(mapping.indexName, mapping.aliasName);
        }
      }
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


  /**
   * Create a new temporary index with the necessary mapping.
   * reindex the data from old to new temporary index and delete the old index.
   *
   * @param mapping
   */
  async reindex(mapping: ElasticMapping): Promise<boolean> {
    let result = false;
    try {
      const tmpIndex = mapping.indexName + '_tmp';
      const tmpMapping = mapping.toRequest();
      tmpMapping.index = tmpIndex;
      const stage = 'create';

      // create the temporary index
      result = await this.doExists(tmpIndex);
      if (result) {
        result = await this.doDeleteIndex(tmpIndex);
      }
      result = await this.doCreateIndex(tmpMapping);
      if (!result) {
        return false;
      }
      // reindex from old to new index
      result = await this.doReindex(mapping.indexName, tmpIndex);
      if (!result) {
        return false;
      }

      // set alias for tmp index and remove from old
      result = await this.doAddAlias(tmpIndex, mapping.aliasName);
      result = await this.doAliasExists(mapping.indexName, mapping.aliasName);
      if (result) {
        result = await this.doRemoveAlias(mapping.indexName, mapping.aliasName);
      }


      // delete old index and create new one
      result = await this.doDeleteIndex(mapping.indexName);
      result = await this.create(mapping, { skipAlias: true, removeCollidingIndex: true });
      if (!result) {
        return false;
      }

      // reindex back from temporary to original
      result = await this.doReindex(tmpIndex, mapping.indexName);
      if (!result) {
        return false;
      }
      // remove alias and delete temporary index
      result = await this.doAddAlias(mapping.indexName, mapping.aliasName);
      result = await this.doRemoveAlias(tmpIndex, mapping.aliasName);
      result = await this.doDeleteIndex(tmpIndex);
    } catch (e) {
      Log.error(e);
      result = false;
    }
    return result;
  }


  doCreateIndex(body: any) {
    return this.client.indices.create(body).then(x => get(x.body, K_ACKNOWLEDGMENT, false));
  }


  /**
   * Elastic API operation to set an alias for an index
   * @param index
   * @param alias
   */
  doAliasExists(index: string, alias: string) {
    return this.client.indices.existsAlias({ index: index, name: alias }).then(x => get(x.body, K_ACKNOWLEDGMENT, false));
  }


  /**
   * Elastic API operation to set an alias for an index
   * @param index
   * @param alias
   */
  doAddAlias(index: string, alias: string) {
    return this.client.indices.putAlias({ index: index, name: alias }).then(x => get(x.body, K_ACKNOWLEDGMENT, false));
  }

  /**
   * Elastic API operation to remove an alias for an index
   * @param index
   * @param alias
   */
  doRemoveAlias(index: string, alias: string) {
    return this.client.indices.deleteAlias({ index: index, name: alias }).then(x => get(x.body, K_ACKNOWLEDGMENT, false));
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
