import { IStorageRefOptions } from '../../IStorageRefOptions';
import { BaseConnectionOptions } from 'typeorm/connection/BaseConnectionOptions';
import { EntitySchema } from 'typeorm/entity-schema/EntitySchema';
import { DatabaseType } from 'typeorm';

export interface ITypeOrmStorageRefOptions extends IStorageRefOptions, BaseConnectionOptions {

  readonly type: string | DatabaseType | any;

  supportSchemaApi?: boolean;

  entities?: ((Function | string | EntitySchema<any> | any))[];

}
