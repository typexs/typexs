import { BASE_MAPPING_DYNAMIC_STRUCTURE, BASE_MAPPING_PROPERTIES_STRUCTURE } from '../Constants';
import { cloneDeep, get, has, isEmpty, isEqual, keys } from 'lodash';
import { ElasticUtils } from '../ElasticUtils';

export class ElasticMapping {

  /**
   * Generated index name
   */
  indexName: string;

  /**
   * Alias name for the index
   */
  aliasName: string;

  dynamicTemplates: any = cloneDeep(BASE_MAPPING_DYNAMIC_STRUCTURE);

  properties: any = cloneDeep(BASE_MAPPING_PROPERTIES_STRUCTURE);

  /**
   * mark if mapping must be reindex
   */
  reindex: boolean = false;


  constructor(name: string = null, options: {skipGenerated: boolean} = {skipGenerated: false}) {
    if (name && !options.skipGenerated) {
      this.aliasName = ElasticUtils.aliasName(name);
      this.indexName = ElasticUtils.indexName(name);
    }else{
      this.aliasName = name;
      this.indexName = name;
    }
  }

  parse(data: any) {
    this.properties = get(data, 'mappings.properties', {});
    this.dynamicTemplates = get(data, 'mappings.dynamic_templates', []);
  }

  add(propertyName: string, definition: any, override: boolean = false) {
    const hasProperty = has(this.properties, propertyName);
    const isValueEqual = hasProperty ? isEqual(this.properties[propertyName], definition) : false;
    this.reindex = this.reindex || (hasProperty && !isValueEqual);
    if (!hasProperty || override) {
      this.properties[propertyName] = definition;
    }

  }


  merge(mapping: ElasticMapping, override:boolean = true) {
    const properties = mapping.getProperties();
    for (const k of keys(properties)) {
      this.add(k, properties[k], override);
    }
    for (const entry of mapping.dynamicTemplates) {
      const k = keys(entry);
      const found = this.dynamicTemplates.find((x:any) => isEqual(keys(x), k));
      if(!found){
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
        mappings: this.toJson()
      }
    };

  }

}
