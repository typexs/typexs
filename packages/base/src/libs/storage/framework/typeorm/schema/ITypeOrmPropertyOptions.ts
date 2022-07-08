import { IPropertyOptions } from '@allgemein/schema-api';
import { ColumnMetadataArgs } from 'typeorm/metadata-args/ColumnMetadataArgs';
import { RelationMetadataArgs } from 'typeorm/metadata-args/RelationMetadataArgs';
import { EmbeddedMetadataArgs } from 'typeorm/metadata-args/EmbeddedMetadataArgs';
import { T_TABLETYPE } from '../Constants';

export interface ITypeOrmPropertyOptions extends IPropertyOptions {
  metadata: ColumnMetadataArgs | RelationMetadataArgs | EmbeddedMetadataArgs;
  tableType: T_TABLETYPE;
}
