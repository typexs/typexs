import { IEntityRef, IPropertyRef } from '@allgemein/schema-api';
import { C_TYPEORM, C_TYPEORM_REGULAR, K_STRINGIFY_OPTION } from './Constants';
import { ITypeOrmEntityOptions } from './schema/ITypeOrmEntityOptions';
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { assign, defaults, get, has, isArray, isString } from 'lodash';

/**
 * Helper to convert ITypeormEntityOptions to TableMetadataArgs
 *
 * @param options
 */
export function createTableTypeOrmOptions(options: ITypeOrmEntityOptions, newEntry: boolean = false) {
  const defaultTypeOrmOptions: TableMetadataArgs = {
    target: options.target,
    type: C_TYPEORM_REGULAR
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

/**
 * Support for storages which not support json as data type.
 * This function converts the as "stringify" defined IPropertyRef's for given entities from json to string.
 * Use on loading of data.
 *
 * @param entityRef
 * @param entities
 * @param strict
 */
export function convertPropertyValueJsonToString(entityRef: IEntityRef, entities: any[], strict: boolean = false) {
  const check = isArray(entities) ? entities : [entities];
  const structuredProps = entityRef.getPropertyRefs()
    .filter(
      (x: IPropertyRef) =>
        x.getOptions(K_STRINGIFY_OPTION, false)
    );
  for (const structuredProp of structuredProps) {
    for (const entity of check) {
      if (strict && !has(entity, structuredProp.name)) {
        continue;
      }
      const value = entity[structuredProp.name];
      if (!isString(value)) {
        try {
          entity[structuredProp.name] = JSON.stringify(value);
        } catch (e) {
        }
      }
    }
  }
}

/**
 * Support for storages which not support json as data type.
 * This function converts the as "stringify" defined IPropertyRef's for given entities from string to json.
 * Use on loading of data.
 *
 * @param entityRef
 * @param entities
 * @param strict
 */
export function convertPropertyValueStringToJson(entityRef: IEntityRef, entities: any[], strict: boolean = false) {
  const check = isArray(entities) ? entities : [entities];
  const structuredProps = entityRef.getPropertyRefs().filter(
    (x: IPropertyRef) =>
      x.getOptions(K_STRINGIFY_OPTION, false)
  );
  for (const structuredProp of structuredProps) {
    for (const entity of check) {
      if (strict && !has(entity, structuredProp.name)) {
        continue;
      }
      const value = entity[structuredProp.name];
      if (isString(value)) {
        try {
          entity[structuredProp.name] = JSON.parse(value);
        } catch (e) {
        }
      }
    }
  }

}
