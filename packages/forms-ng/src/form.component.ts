// noinspection AngularMissingOrInvalidDeclarationInModule

import { cloneDeep, defaults, find } from 'lodash';
import { Component, ComponentFactoryResolver, EventEmitter, Injector, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormService } from './form.service';
import { Form, IFormOptions } from '@typexs/forms';
import { EntityResolverService, IMessage, MessageChannel } from '@typexs/base-ng';
import { AbstractFormComponent } from './component/AbstractFormComponent';
import { DataContainer, ILookupRegistry, RegistryFactory } from '@allgemein/schema-api';
import { ViewComponent } from '@typexs/base/libs/bindings/decorators/ViewComponent';


export const DEFAULT_FORM_OPTIONS: IFormOptions = {
  buttons: [
    {
      key: 'submit',
      label: 'Submit',
      type: 'submit'
    },
    {
      key: 'reset',
      label: 'Reset',
      type: 'restore'
    }
  ]
};

@ViewComponent('form')
@Component({
  selector: 'txs-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
  // host: {'(submit)': 'onSubmit($event)', '(reset)': 'onReset()'},
  // outputs: ['ngSubmit'],
})
export class FormComponent extends AbstractFormComponent<Form> implements OnInit, OnDestroy {

  /**
   * TODO dynamically create needed buttons
   */
  @Output()
  ngSubmit = new EventEmitter();

  @Output()
  ngReset = new EventEmitter();

  @Output()
  ngButton = new EventEmitter();

  @Input()
  channel: MessageChannel<IMessage>;

  @Input()
  options: IFormOptions = DEFAULT_FORM_OPTIONS;

  @Input()
  formName: string;

  @Input()
  instance: any;

  @Input()
  registry: ILookupRegistry;

  original: any;

  formObject: Form;

  constructor(
    // eslint-disable-next-line no-unused-vars
    private formService: FormService,
    public injector: Injector,
    public r: ComponentFactoryResolver,
    // eslint-disable-next-line no-unused-vars
    private resolver: EntityResolverService
  ) {
    super(injector, r);
    // TODO ...
    // if (!this.registry) {
    //   this.registry = resolver.
    // }
  }


  ngOnInit() {
    this.original = cloneDeep(this.instance);
    this.options = defaults(this.options, DEFAULT_FORM_OPTIONS);
    this.reset();
  }


  reset() {
    // TODO instance must be present
    super.reset();
    if (!this.registry) {
      const entityRef = this.resolver.getEntityRef(this.instance);
      if (entityRef) {
        this.registry = entityRef.getRegistry();
      } else {
        this.registry = RegistryFactory.get();
      }
    }
    this.dataContainer = new DataContainer(this.instance, this.registry);
    this.formObject = this.formService.get(
      this.formName, this.instance, this.registry, this.options
    );
    // TODO restructure form
    this.build(this.formObject);
  }


  ngOnDestroy(): void {
  }


  async onSubmit($event: Event): Promise<boolean> {
    if ($event.type === 'submit') {
      // ignore mouse event
      if (this.channel) {
        // clear
        this.channel.publish(null);
      }
      await this.dataContainer.validate();
      this.ngSubmit.emit({ event: $event, data: this.dataContainer });
    }
    return false;
  }


  async onReset($event: Event): Promise<boolean> {
    if (this.channel) {
      // clear
      this.channel.publish(null);
    }
    this.instance = cloneDeep(this.original);

    this.reset();
    this.ngReset.emit({ event: $event, data: this.dataContainer });
    return false;
  }


  async onButton(key: string, $event: Event): Promise<boolean> {
    const btn = find(this.options.buttons, b => b.key === key);
    if (btn.type === 'submit') {
      return this.onSubmit($event);
    } else if (btn.type === 'restore') {
      return this.onReset($event);
    } else {
      this.ngButton.emit({ button: btn, event: $event, data: this.dataContainer });
    }
    return false;
  }
}

