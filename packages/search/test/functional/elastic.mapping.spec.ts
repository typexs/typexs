import { Client } from '@elastic/elasticsearch';
import { RegistryFactory } from '@allgemein/schema-api';
import { suite, test } from '@testdeck/mocha';
import { C_SEARCH_INDEX } from '../../src/lib/Constants';
import { Bootstrap } from '@typexs/base';
import { NAMESPACE_BUILT_ENTITY } from '@typexs/entity';
import { IndexEntityRegistry } from '../../src/lib/registry/IndexEntityRegistry';
import { EntityWithElasticTypes } from './scenarios/app_with_mapping/entities/EntityWithElasticTypes';
import { ElasticUtils } from '../../src/lib/elastic/ElasticUtils';
import { expect } from 'chai';
import { EntityWithReference } from './scenarios/app_with_mapping/entities/EntityWithReference';
import { X, Y } from './helper/Constants.mapping';
import { ElasticMapping } from '../../src/lib/elastic/mapping/ElasticMapping';
import { BASE_MAPPING_DYNAMIC_STRUCTURE, BASE_MAPPING_PROPERTIES_STRUCTURE, DEFAULT_TEXT_MAPPING } from '../../src/lib/elastic/Constants';
import { ElasticMappingUpdater } from '../../src/lib/elastic/mapping/ElasticMappingUpdater';
import { ES_host, ES_port } from './config';

@suite('functional/elastic/mapping')
class TypexsSearchElasticMappingSpec {

  static before() {
    RegistryFactory.register(C_SEARCH_INDEX, IndexEntityRegistry);
    RegistryFactory.register(/^search-index\..*/, IndexEntityRegistry);
  }

  before() {
    Bootstrap.reset();
  }


  // static async after() {
  //   const client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
  //   const update = new ElasticMappingUpdater(client);
  //   await update.doDeleteIndex('demo_index');
  //   await update.doDeleteIndex('demo_index_2');
  // }


  @test
  async 'elastic mapping definition generation for primative types'() {
    const classRef = RegistryFactory.get(NAMESPACE_BUILT_ENTITY).getEntityRefFor(EntityWithElasticTypes);
    const ref = IndexEntityRegistry.$()._create(classRef, 'gen-index', { allowAutoAppendAllField: false });
    const mapping = ElasticUtils.buildMappingPropertiesTree(ref);
    expect(mapping).to.be.deep.eq(X);
  }


  @test
  async 'elastic mapping definition generation for reference'() {
    const classRef = RegistryFactory.get(NAMESPACE_BUILT_ENTITY).getEntityRefFor(EntityWithReference);
    const ref = IndexEntityRegistry.$()._create(classRef, 'gen-index', { allowAutoAppendAllField: false });
    const mapping = ElasticUtils.buildMappingPropertiesTree(ref);
    expect(mapping).to.be.deep.eq(Y);
  }


  @test
  async 'merge mappings without reindexing - adding single field'() {
    const mapping1 = new ElasticMapping('test_map_01');
    const mapping2 = new ElasticMapping('test_map_02');
    mapping2.add('str', DEFAULT_TEXT_MAPPING);

    mapping1.merge(mapping2);

    expect(mapping1.reindex).to.be.false;
    expect(mapping1.properties).to.be.include.keys(['str']);
    expect(mapping1.properties.str).to.be.deep.eq(DEFAULT_TEXT_MAPPING);

  }


  @test
  async 'merge mappings with reindexing - replace single field'() {
    const mapping1 = new ElasticMapping('test_map_01');
    mapping1.add('str', DEFAULT_TEXT_MAPPING);
    const mapping2 = new ElasticMapping('test_map_02');
    mapping2.add('str', { type: 'text' });

    mapping1.merge(mapping2);

    expect(mapping1.reindex).to.be.true;
    expect(mapping1.properties).to.be.include.keys(['str']);
    expect(mapping1.properties.str).to.be.deep.eq({ type: 'text' });

  }


  @test
  async 'merge mappings without reindexing - add same field'() {
    const mapping1 = new ElasticMapping('test_map_01');
    mapping1.add('str', DEFAULT_TEXT_MAPPING);
    const mapping2 = new ElasticMapping('test_map_02');
    mapping2.add('str', DEFAULT_TEXT_MAPPING);

    mapping1.merge(mapping2);

    expect(mapping1.reindex).to.be.false;
    expect(mapping1.properties).to.be.include.keys(['str']);
    expect(mapping1.properties.str).to.be.deep.eq(DEFAULT_TEXT_MAPPING);

  }


  @test
  async 'check mapping updater - loading all'() {
    const client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    // index name
    const INDEX_NAME = 'demo_index';

    const existsData = await client.indices.exists({ index: INDEX_NAME });
    if (!existsData.body) {
      await client.indices.create({ index: INDEX_NAME });
    }
    const resPutMapping = await client.indices.putMapping({
      index: INDEX_NAME,
      body: {
        'properties': {
          'email': {
            'type': 'keyword'
          }
        }
      }
    });

    const update = new ElasticMappingUpdater(client);
    const indicesNames = await update.reload();
    await client.close();

    expect(indicesNames).to.include.members([INDEX_NAME]);
    const x = update.getBy(INDEX_NAME);
    expect(x.toJson()).to.be.deep.eq({
      'properties': {
        'email': {
          'type': 'keyword'
        }
      }
    });
  }


  @test
  async 'check mapping updater - reindex on change'() {
    const client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    const update = new ElasticMappingUpdater(client);

    // index name
    const INDEX_NAME = 'demo_index_2';



    const mapping = new ElasticMapping(INDEX_NAME);
    mapping.add('number', {'type': 'text'});

    const existsData = await client.indices.exists({ index: mapping.indexName });
    if (existsData.body) {
      await update.doDeleteIndex(mapping.indexName);
    }

    const existsTmpData = await client.indices.exists({ index:  mapping.indexName  + '_tmp' });
    if (existsTmpData.body) {
      await update.doDeleteIndex( mapping.indexName  + '_tmp');
    }
    await update.create(mapping);


    await update.reload( mapping.indexName );
    const loadedMapping = update.getBy( mapping.indexName );
    const generatedMapping = new ElasticMapping( mapping.indexName );
    generatedMapping.add('number', { type: 'long' });
    generatedMapping.merge(loadedMapping, false);
    expect(generatedMapping.reindex).to.be.true;
    let res = await update.reindex(generatedMapping);
    expect(res).to.be.true;
    const indicesNames = await update.reload();
    await client.close();

    expect(indicesNames).to.include.members([ mapping.indexName ]);
    const x = update.getBy( mapping.indexName );
    expect(x.toJson()).to.be.deep.eq({
      'dynamic_templates': BASE_MAPPING_DYNAMIC_STRUCTURE,
      'properties': {
        ...BASE_MAPPING_PROPERTIES_STRUCTURE,
        'number': {
          'type': 'long'
        }
      }
    });
  }


  @test
  async 'check mapping updater - update on change'() {
    const client = new Client({ node: 'http://' + ES_host + ':' + ES_port });
    const update = new ElasticMappingUpdater(client);
    // index name
    const INDEX_NAME = 'demo_index_3';
    const mapping = new ElasticMapping(INDEX_NAME);
    mapping.add('number', {'type': 'text'});

    const existsData = await client.indices.exists({ index: mapping.indexName });
    if (existsData.body) {
      await update.doDeleteIndex(mapping.indexName);
    }

    const existsTmpData = await client.indices.exists({ index:  mapping.indexName  + '_tmp' });
    if (existsTmpData.body) {
      await update.doDeleteIndex( mapping.indexName  + '_tmp');
    }

    await update.create(mapping);


    await update.reload(mapping.indexName );
    const loadedMapping = update.getBy(mapping.indexName );

    const generatedMapping = new ElasticMapping(mapping.indexName );
    generatedMapping.merge(loadedMapping, false);

    let res = await update.update(generatedMapping);
    expect(res).to.be.true;
    const indicesNames = await update.reload();
    await client.close();

    expect(indicesNames).to.include.members([mapping.indexName ]);
    const x = update.getBy(mapping.indexName );
    expect(x.toJson()).to.be.deep.eq({
      'dynamic_templates': BASE_MAPPING_DYNAMIC_STRUCTURE,
      'properties': {
        ...BASE_MAPPING_PROPERTIES_STRUCTURE,
        'number': {
          'type': 'text'
        }
      }
    });
  }


}

