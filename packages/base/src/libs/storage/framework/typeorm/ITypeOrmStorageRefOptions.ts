import { IStorageRefOptions } from '../../IStorageRefOptions';
import { BaseConnectionOptions } from 'typeorm/connection/BaseConnectionOptions';
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema';

export interface ITypeOrmStorageRefOptions extends IStorageRefOptions, BaseConnectionOptions {

  supportSchemaApi?: boolean;

  entities?: ((Function | string | EntitySchema<any> | any))[];

}
