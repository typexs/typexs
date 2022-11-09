import { IEntityRef, IPropertyRef } from '@allgemein/schema-api';
import * as _ from 'lodash';
import { C_TYPEORM, K_STRINGIFY_OPTION } from './Constants';
import { ITypeOrmEntityOptions } from './schema/ITypeOrmEntityOptions';
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { assign, defaults, get } from 'lodash';
import { boolean } from 'yargs';

/**
 * Helper to convert ITypeormEntityOptions to TableMetadataArgs
 *
 * @param options
 */
export function createTableTypeOrmOptions(options: ITypeOrmEntityOptions, newEntry: boolean = false) {
  const defaultTypeOrmOptions: TableMetadataArgs = {
    target: options.target,
    type: 'regular'
  };
  // if name present pass through
  if (options.name) {
    defaultTypeOrmOptions.name = options.name;
  }
  // if internal name is present set it for name
  if (options.internalName) {
    defaultTypeOrmOptions.name = options.internalName;
  }
  let typeOrmOptions: TableMetadataArgs = get(options, C_TYPEORM, defaultTypeOrmOptions);
  typeOrmOptions = defaults(typeOrmOptions, <TableMetadataArgs & { new: boolean }>{
    ...(newEntry ? { new: true } : {}),
    ...defaultTypeOrmOptions
  });
  assign(typeOrmOptions, options.metadata ? options.metadata : {});
  return typeOrmOptions;

}

export function convertPropertyValueJsonToString(entityRef: IEntityRef, entities: any[]) {
  const check = _.isArray(entities) ? entities : [entities];
  const structuredProps = entityRef.getPropertyRefs()
    .filter(
      (x: IPropertyRef) =>
        x.getOptions(K_STRINGIFY_OPTION, false)
    );
  for (const structuredProp of structuredProps) {
    for (const entity of check) {
      const value = entity[structuredProp.name];
      if (!_.isString(value)) {
        try {
          entity[structuredProp.name] = JSON.stringify(value);
        } catch (e) {
        }
      }
    }
  }
}

export function convertPropertyValueStringToJson(entityRef: IEntityRef, entities: any[]) {
  const check = _.isArray(entities) ? entities : [entities];
  const structuredProps = entityRef.getPropertyRefs().filter(
    (x: IPropertyRef) =>
      x.getOptions(K_STRINGIFY_OPTION, false)
  );
  for (const structuredProp of structuredProps) {
    for (const entity of check) {
      const value = entity[structuredProp.name];
      if (_.isString(value)) {
        try {
          entity[structuredProp.name] = JSON.parse(value);
        } catch (e) {
        }
      }
    }
  }

}
