import { assign, defaults, has } from 'lodash';
import { ClassRef, DefaultEntityRef, IEntityOptions, JsonSchema, METATYPE_PROPERTY } from '@allgemein/schema-api';
import { IJsonSchemaSerializeOptions } from '@allgemein/schema-api/lib/json-schema/IJsonSchemaSerializeOptions';
import { C_INTERNAL_NAME, C_METADATA, REGISTRY_TYPEORM } from '../Constants';
import { ITypeOrmEntityOptions } from './ITypeOrmEntityOptions';


export class TypeOrmEntityRef extends DefaultEntityRef {

  constructor(_options: ITypeOrmEntityOptions) {
    super(defaults(assign(_options, { namespace: REGISTRY_TYPEORM }), <ITypeOrmEntityOptions>{
      metaType: METATYPE_PROPERTY,
      namespace: REGISTRY_TYPEORM,
      target: _options.metadata.target,
      name: ClassRef.getClassName(_options.metadata.target)
    }));
    const options = this.getOptions();
    if (has(options, [C_METADATA, 'new'].join('.'))) {
      delete options.metadata['new'];
    }
    this.setOptions(options);
  }

  get metadata() {
    return this.getOptions(C_METADATA);
  }

  id() {
    return this.getSourceRef().id().toLowerCase();
  }

  getTableName() {
    if (this.getOptions('metadata.name', null)) {
      return this.getOptions('metadata.name');
    }
    return this.storingName;
  }


  toJsonSchema(options: IJsonSchemaSerializeOptions = {}) {
    options = options || {};
    return JsonSchema.serialize(this, {
      ...options,
      namespace: this.namespace,
      allowKeyOverride: true,
      deleteReferenceKeys: false,
      postProcess: (src, dst, serializer) => {
        if (has(dst, 'cardinality')) {
          delete dst['cardinality'];
        }
      }
    });
  }


}
