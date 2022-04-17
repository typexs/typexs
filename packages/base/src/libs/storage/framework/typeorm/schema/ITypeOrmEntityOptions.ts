import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { IEntityOptions } from '@allgemein/schema-api';

export interface ITypeOrmEntityOptions extends IEntityOptions {
  metadata: TableMetadataArgs;
}
