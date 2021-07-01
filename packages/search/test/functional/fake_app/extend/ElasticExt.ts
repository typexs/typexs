import * as _ from 'lodash';
import {IIndexElasticApi} from '../../../../src/api/IIndexElasticApi';
import {IndexElasticApi} from '../../../../src/api/IndexElastic.api';
import {UseAPI} from '@typexs/base/decorators/UseAPI';
import {IndexEntityRef} from '../../../../src/lib/registry/IndexEntityRef';


@UseAPI(IndexElasticApi)
export class ElasticExt implements IIndexElasticApi {

  doBeforeIndexRepositoryCreate(indexData: any, types: IndexEntityRef[]) {
    if (!indexData.body.mappings) {
      indexData.body.mappings = {};
    }

    if (!_.has(indexData.body.mappings, 'properties')) {
      _.set(indexData.body.mappings, 'properties', {});
    }
    indexData.body.mappings.properties['_content_'] = {type: 'keyword', 'ignore_above': 20};

    if (process.env.ES_EXT_NEW) {
      indexData.body.mappings.properties['_content_st_'] = {type: 'text'};
    }

    if (process.env.ES_EXT_UPDATE) {
      indexData.body.mappings.properties['_content_'] = {type: 'keyword', 'ignore_above': 50};
    }

  }
}
