import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {EntityTypeReader, IEntityTypeReaderOptions} from '../../src/adapters/pipeline/readers/EntityTypeReader';
import {PipelineRegistry} from '../../src/lib/PipelineRegistry';
import {RuntimeLoader} from '@typexs/base';
import {XS_LIBS_PIPELINE_PROCESSORS, XS_LIBS_PIPELINE_READERS} from '../../src';
import {ClassRef, Entity} from '@allgemein/schema-api';
import {get} from 'lodash';

@Entity()
export class DefinedEntity {
  processed: number;
}


@suite('functional/queue-reader')
export class EntityTypeReaderSpec {

  @test
  async 'entity type reader - process'() {
    const qr = new EntityTypeReader({
      entityType: DefinedEntity
    });
    qr.pipe((x: DefinedEntity) => {
      x.processed = 1234;
      return x;
    });

    const e = new DefinedEntity();
    const ret = await qr.doProcess(e);

    expect(ret.processed).to.be.eq(1234);
  }

  @test
  async 'entity type reader - find by type'() {
    const registry = new PipelineRegistry();
    const loader = new RuntimeLoader({
      appdir: __dirname + '/../..',
      disableCache: true,
      libs: [
        {
          topic: XS_LIBS_PIPELINE_READERS,
          refs: [
            'src/adapters/pipeline/readers/*'
          ],
        },
        {
          topic: XS_LIBS_PIPELINE_PROCESSORS,
          refs: [
            'src/adapters/pipeline/processors/*',
            'test/functional/adapters/processors/*'
          ],
        }
      ]
    });
    await loader.prepare();
    await registry.load(loader);

    registry.register('entity_type_defined_entity', {
      reader: {
        name: 'entity_type_reader',
        options: <IEntityTypeReaderOptions<any>>{
          entityType: ClassRef.get(DefinedEntity).name
        }
      },
      pipe: [
        {
          processor: {
            name: 'defined_processor'
          }
        }
      ]
    });


    const v = registry.find(x =>
      get(x, 'reader.name') === 'entity_type_reader' &&
      (
        get(x, 'reader.options.entityType') === 'defined_entity' ||
        get(x, 'reader.options.entityType') === 'DefinedEntity' ||
        get(x, 'reader.options.entityType') === DefinedEntity
      )
    );

    expect(v).to.be.not.undefined;
    const build = v.create().build();
    expect(build).to.be.not.undefined;

    const ret = await build.doProcess(new DefinedEntity());
    expect(ret).instanceOf(DefinedEntity);
    expect(JSON.parse(JSON.stringify(ret))).to.be.deep.eq({processed: 1234});

  }
}
