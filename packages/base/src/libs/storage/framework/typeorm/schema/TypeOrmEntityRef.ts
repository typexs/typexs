import {defaults, has} from 'lodash';
import {ClassRef, DefaultEntityRef, IEntityOptions, JsonSchema, METATYPE_PROPERTY} from '@allgemein/schema-api';
import {IJsonSchemaSerializeOptions} from '@allgemein/schema-api/lib/json-schema/IJsonSchemaSerializeOptions';
import {REGISTRY_TYPEORM} from '../Constants';
import { ITypeOrmEntityOptions } from './ITypeOrmEntityOptions';



export class TypeOrmEntityRef extends DefaultEntityRef {

  constructor(_options: ITypeOrmEntityOptions) {
    super(defaults(_options, <ITypeOrmEntityOptions>{
      metaType: METATYPE_PROPERTY,
      namespace: REGISTRY_TYPEORM,
      target: _options.metadata.target,
      name: ClassRef.getClassName(_options.metadata.target)
    }));
    const options = this.getOptions();
    if (has(options, 'metadata.new')) {
      delete options.metadata['new'];
    }
    this.setOptions(options);
  }

  get metadata() {
    return this.getOptions('metadata');
  }

  id() {
    return this.getSourceRef().id().toLowerCase();
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
