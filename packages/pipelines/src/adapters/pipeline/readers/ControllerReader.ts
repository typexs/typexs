import * as _ from 'lodash';
import { C_RAW, EntityControllerRegistry, IEntityController, IFindOptions, Injector, XS_P_$COUNT, XS_P_$OFFSET } from '@typexs/base';
import { ClassType } from '@allgemein/schema-api';
import { Reader } from '../../../lib/reader/Reader';
import { IControllerReaderOptions } from '../../../lib/reader/IControllerReaderOptions';


export class ControllerReader<T> extends Reader {

  private entityType: ClassType<T>;

  private count: number;

  private offset = 0;

  private size = 0;

  private _hasNext = true;

  // private entityRef: IEntityRef;

  private controller: IEntityController;

  private chunk: T[];


  constructor(options: IControllerReaderOptions<T>) {
    super(ControllerReader.name, options);

    const registry = Injector.get(EntityControllerRegistry.NAME) as EntityControllerRegistry;
    this.controller = registry.getControllerForClass(options.entityType);
    this.entityType = options.entityType;


  }

  doFetch() {
    return this.chunk;
  }


  get chunkSize() {
    return this.getOptions().size;
  }

  async hasNext(): Promise<boolean> {
    await this.find();
    return this._hasNext;
  }

  getOptions(): IControllerReaderOptions<T> {
    return <IControllerReaderOptions<T>>super.getOptions();
  }

  get conditions() {
    return this.getOptions().conditions ? this.getOptions().conditions : null;
  }

  hasMaxLimit() {
    return this.getOptions().maxLimit && this.getOptions().maxLimit > 0;
  }

  getMaxLimit() {
    return this.getOptions().maxLimit;
  }

  getRaw() {
    return _.get(this.getOptions(), C_RAW, false);
  }

  async find() {
    // let offset = this.offset;
    let limit = this.getOptions().size;

    if (this.hasMaxLimit()) {
      if (this.size < this.getMaxLimit()) {
        if ((this.size + limit) > this.getMaxLimit()) {
          limit = this.getMaxLimit() - this.size;
        }
      }

      if (this.count > this.getMaxLimit()) {
        this.count = this.getMaxLimit();
      }
    }

    this._hasNext = _.isUndefined(this.count) ? true : this.size < this.count;

    if (limit > 0 && this._hasNext) {

      const findOptions: IFindOptions = {
        offset: this.offset,
        limit: limit,
        raw: this.getRaw()
      };

      if (this.getOptions().sort) {
        findOptions.sort = this.getOptions().sort;
      }

      this.chunk = await this.controller.find(
        this.entityType, this.conditions, findOptions);
      this.offset = this.chunk[XS_P_$OFFSET];
      this.size = this.size + this.chunk.length;
      // calc next offset
      this.offset = this.offset + this.getOptions().size;
      this.count = this.chunk[XS_P_$COUNT];
    }


  }

}
