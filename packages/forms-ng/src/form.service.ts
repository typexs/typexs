import { Injectable } from '@angular/core';
import { Form, FormBuilder, IFormOptions } from '@typexs/forms';
import { ILookupRegistry } from '@allgemein/schema-api';
import { ComponentRegistryService } from '@typexs/base-ng';


@Injectable()
export class FormService {

  // cache: any = {};

  // eslint-disable-next-line no-unused-vars
  constructor(private componentRegistry: ComponentRegistryService) {
  }

  get(name: string, instance: any, registry: ILookupRegistry, options: IFormOptions): Form {
    // TODO lookup for form modifications
    const entityDef = registry.getEntityRefFor(instance);
    const formBuilder = new FormBuilder(this.componentRegistry.registry, options);
    return formBuilder.buildFromEntity(entityDef);
  }

}
