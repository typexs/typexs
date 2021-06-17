import {Injectable} from '@angular/core';
import {Form, FormBuilder} from '@typexs/ng';
import {ILookupRegistry} from '@allgemein/schema-api';
import {ComponentRegistryService} from '@typexs/base-ng';


@Injectable()
export class FormService {

  cache: any = {};

  constructor(private componentRegistry: ComponentRegistryService) {
  }

  get(name: string, instance: any, registry: ILookupRegistry): Form {
    // TODO lookup for form modifications
    const entityDef = registry.getEntityRefFor(instance);
    const builder2 = new FormBuilder(this.componentRegistry.registry);
    return builder2.buildFromEntity(entityDef);
  }

}
