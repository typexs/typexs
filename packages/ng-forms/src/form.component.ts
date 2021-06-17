import {cloneDeep, find} from 'lodash';
import {Component, ComponentFactoryResolver, EventEmitter, Injector, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormService} from './form.service';
import {Form, ViewComponent} from '@typexs/ng';
import {EntityResolverService, IMessage, MessageChannel} from '@typexs/base-ng';
import {IFormOptions} from './IFormOptions';
import {AbstractFormComponent} from './component/AbstractFormComponent';
import {DataContainer} from '@allgemein/schema-api';
import {RegistryFactory} from '@allgemein/schema-api';


@ViewComponent('form')
@Component({
  selector: 'txs-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
  // host: {'(submit)': 'onSubmit($event)', '(reset)': 'onReset()'},
  // outputs: ['ngSubmit'],
})
export class FormComponent extends AbstractFormComponent<Form> implements OnInit, OnDestroy {

  @Output()
  ngSubmit = new EventEmitter();

  @Output()
  ngReset = new EventEmitter();

  @Output()
  ngButton = new EventEmitter();

  @Input()
  channel: MessageChannel<IMessage>;

  @Input()
  options: IFormOptions = {
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
      },
    ],
  };


  @Input()
  formName: string;

  @Input()
  instance: any;

  @Input()
  registry: any;

  original: any;

  formObject: any;

  constructor(private formService: FormService,
              public injector: Injector,
              public r: ComponentFactoryResolver,
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
    this.reset();
  }


  reset() {
    // TODO instance must be present
    super.reset();

    if (!this.registry) {
      const service = this.resolver.getServiceFor(this.instance);
      if (service) {
        this.registry = service.getRegistry();
      } else {
        this.registry = RegistryFactory.get();
      }
    }
    this.data = new DataContainer(this.instance, this.registry);
    this.formObject = this.formService.get(this.formName, this.instance, this.registry);
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
      await this.data.validate();
      this.ngSubmit.emit({event: $event, data: this.data});

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
    this.ngReset.emit({event: $event, data: this.data});
    return false;
  }


  async onButton(key: string, $event: Event): Promise<boolean> {
    const btn = find(this.options.buttons, b => b.key === key);
    if (btn.type === 'submit') {
      return this.onSubmit($event);
    } else if (btn.type === 'restore') {
      return this.onReset($event);
    } else {
      this.ngButton.emit({button: btn, event: $event, data: this.data});
    }
    return false;
  }
}

