import { BASE_MAPPING_DYNAMIC_STRUCTURE, BASE_MAPPING_PROPERTIES_STRUCTURE } from '../Constants';
import { cloneDeep, defaults, get, has, isEmpty, isEqual, keys } from 'lodash';
import { ElasticUtils } from '../ElasticUtils';
import { ArrayUtils } from '@allgemein/base/utils/ArrayUtils';


export interface IElasticMappingOptions {
  skipGenerated?: boolean;
  skipPropertyNames?: string[];
}

export class ElasticMapping {

  /**
   * Generated index name
   */
  indexName: string;

  /**
   * Alias name for the index
   */
  aliasName: string;

  /**
   * Settings for mapping
   */
  settings: any = {};

  /**
   * Dynamic templates
   */
  dynamicTemplates: any = cloneDeep(BASE_MAPPING_DYNAMIC_STRUCTURE);

  /**
   * Mapping properties
   */
  properties: any = cloneDeep(BASE_MAPPING_PROPERTIES_STRUCTURE);

  /**
   * mark if mapping must be reindex
   */
  private reindex: boolean = false;

  /**
   * Mark if mapping has changes somehow
   *
   * @param name
   * @param options
   */
  private changed: boolean = false;

  private options: IElasticMappingOptions;

  constructor(name: string = null, options?: IElasticMappingOptions) {
    this.options = defaults(options || {}, {
      skipGenerated: false,
      skipPropertyNames: ['_id']
    });
    if (name && !this.options.skipGenerated) {
      this.aliasName = ElasticUtils.aliasName(name);
      this.indexName = ElasticUtils.indexName(name);
    } else {
      this.aliasName = ElasticUtils.aliasName(name);
      this.indexName = name;
    }
  }


  hasChanges() {
    return this.changed;
  }


  toReindex() {
    return this.reindex;
  }


  parse(data: any) {
    this.properties = get(data, 'mappings.properties', {});
    this.dynamicTemplates = get(data, 'mappings.dynamic_templates', []);
  }


  add(propertyName: string, definition: any, detectChanges: boolean = false) {
    if (get(this.options, 'skipPropertyNames', []).includes(propertyName)) {
      return;
    }

    let reindex = false;
    let changes = false;
    const hasProperty = has(this.properties, propertyName);
    if (hasProperty) {
      const changeList = ArrayUtils.merge(this.properties[propertyName], definition);
      if (changeList.length > 0) {
        changes = true;
        reindex = changeList.filter((x: any) =>
          (['value', 'push'].includes(x.type) && /(type|copy_to)$/.test(x.key)) || x.type === 'missing'
        ).length > 0;
      }
    } else {
      this.properties[propertyName] = definition;
      changes = true;
    }

    if (detectChanges) {
      this.reindex = this.reindex || reindex;
      this.changed = this.reindex || changes;
    }

  }

  resetFlags() {
    this.reindex = false;
    this.changed = false;
  }


  merge(mapping: ElasticMapping, detectChanges: boolean = true) {
    const properties = mapping.getProperties();
    for (const k of  Object.keys(properties)) {
      this.add(k, properties[k], detectChanges);
    }
    for (const entry of mapping.dynamicTemplates) {
      const k =  Object.keys(entry);
      const found = this.dynamicTemplates.find((x: any) => isEqual(keys(x), k));
      if (!found) {
        this.changed = true;
        this.dynamicTemplates.push(entry);
      }
    }
  }

  getProperties() {
    return this.properties;
  }

  toJson() {
    return {
      ...(!isEmpty(this.dynamicTemplates) ? { dynamic_templates: this.dynamicTemplates } : {}),
      properties: this.properties
    };
  }

  toRequest() {
    return {
      index: this.indexName,
      body: {
        mappings: this.toJson(),
        settings: this.settings
      }
    };

  }

}
