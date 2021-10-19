import {ClassType} from '@allgemein/schema-api';
import {IReaderOptions} from '../../../lib/reader/IReaderOptions';
import {AbstractReader} from '../../../lib/reader/AbstractReader';


export interface IEntityTypeReaderOptions<X> extends IReaderOptions {
  entityType: string | ClassType<X>;
}

export class EntityTypeReader<X> extends AbstractReader {

  constructor(opts: IEntityTypeReaderOptions<X>) {
    super(EntityTypeReader.name, opts);
  }


}
