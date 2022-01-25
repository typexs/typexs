import { ElasticUtils } from '../../src/lib/elastic/ElasticUtils';
import { ElasticMappingUpdater } from '../../src/lib/elastic/mapping/ElasticMappingUpdater';

export const lorem = 'lorem ipsum carusus dolor varius sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
  'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
  'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
  'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur ' +
  'sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
  'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
  'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';

export const lorem2 = 'lorem ipsum dolor varius harsut sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod ' +
  'tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero ' +
  'eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea ' +
  'takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur ' +
  'sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna ' +
  'aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea ' +
  'rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.';


export const C_DATA_INDEX = ElasticUtils.indexName('data_index');
export const C_SEARCH_INDEX_2 = ElasticUtils.indexName('search_index');
export const C_CORE_INDEX = ElasticUtils.indexName('core');
export const C_FAILING_INDEX = ElasticUtils.indexName('failing');

export async function clear(updater:ElasticMappingUpdater){

  for(const x of [C_CORE_INDEX, C_FAILING_INDEX, C_SEARCH_INDEX_2, C_DATA_INDEX]){
    // delete index
    const coreDel = await  updater.doExists(x);
    if (coreDel) {
      await updater.doDeleteIndex(x);
    }
  }
}
