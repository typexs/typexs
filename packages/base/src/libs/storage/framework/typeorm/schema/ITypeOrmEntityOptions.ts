import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { IEntityOptions } from '@allgemein/schema-api';

export interface ITypeOrmEntityOptions extends IEntityOptions {

  /**
   * Table name for internal table
   */
  internalName?: string;

  /**
   * metadata from typeorm
   */
  metadata: TableMetadataArgs;
}
