import { IIndexElasticApi } from '../../../../src/api/IIndexElasticApi';
import { IndexElasticApi } from '../../../../src/api/IndexElastic.api';
import { UseAPI } from '@typexs/base/decorators/UseAPI';
import { IndexEntityRef } from '../../../../src/lib/registry/IndexEntityRef';
import { ElasticMapping } from '../../../../src/lib/elastic/mapping/ElasticMapping';


@UseAPI(IndexElasticApi)
export class ElasticExt implements IIndexElasticApi {

  doBeforeIndexRepositoryCreate(indexData: ElasticMapping, types: IndexEntityRef[]) {
    indexData.add('_content_', { type: 'keyword', 'ignore_above': 20 });

    if (process.env.ES_EXT_NEW) {
      indexData.add('_content_st_', { type: 'text' });
    }

    if (process.env.ES_EXT_UPDATE) {
      indexData.add('_content_st_', { type: 'keyword', 'ignore_above': 50 }, true);
    }

  }
}
