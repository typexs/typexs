import { Injector, XS_P_$COUNT, XS_P_$OFFSET } from '@typexs/base';
import { EntityController, EntityRegistry, IFindOptions } from '@typexs/entity';

import { ClassType, IEntityRef } from '@allgemein/schema-api';
import { first, isArray, isEmpty, isUndefined, keys, merge } from 'lodash';
import { IReaderOptions, Reader } from '@typexs/pipelines';


export interface IEntityControllerReaderOptions<T> extends IReaderOptions, IFindOptions {

  /**
   * Optional name for the storage
   */
  storageName?: string;

  /**
   * Entity class type which will be read
   */
  entityType: ClassType<T>;

  /**
   * Maximal limit for the reading entities
   */
  maxLimit?: number;

}


export class EntityControllerReader<T> extends Reader {


  private entityType: ClassType<T>;

  private count: number;

  private offset = 0;

  private size = 0;

  private _hasNext = true;

  private schemaName: string;

  private entityRef: IEntityRef;

  private entityController: EntityController;

  private chunk: T[];


  constructor(options: IEntityControllerReaderOptions<T>) {
    super(EntityControllerReader.name, options);
    this.entityType = options.entityType;
    this.entityRef = EntityRegistry.$().getEntityRefFor(this.entityType);

    this.schemaName = options.storageName;
    if (!this.schemaName) {
      const schemas = this.entityRef.getOptions('schema', []);
      if (!isEmpty(schemas)) {
        if (isArray(schemas)) {
          this.schemaName = first(schemas);
        } else {
          this.schemaName = schemas;
        }
      }
    }

    this.entityController = Injector.get('EntityController.' + this.schemaName);

    // keys(options).forEach(k => {
    //   if (!['entityType', 'storageName', 'conditions', 'maxLimit',
    //     'pipe_handler', 'logger', 'size', 'finishCallback', 'finishCallback'].includes(k)) {
    //     this.findOptions[k] = options[k];
    //   }
    // });

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

  getOptions(): IEntityControllerReaderOptions<T> {
    return <IEntityControllerReaderOptions<T>>super.getOptions();
  }


  hasMaxLimit() {
    return this.getOptions().maxLimit && this.getOptions().maxLimit > 0;
  }

  getMaxLimit() {
    return this.getOptions().maxLimit;
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
        this.$stats.count = this.count;
      }
    }

    this._hasNext = isUndefined(this.count) ? true : this.size < this.count;

    if (limit > 0 && this._hasNext) {
      const conditions = await this.getConditions();
      const start = Date.now();
      const selectedValues: any = this.getFilteredOptions();
      const options = merge(selectedValues, <IFindOptions>{
        offset: this.offset,
        limit: limit,
        subLimit: 0 // 100 * this.chunkSize
      });
      this.chunk = await this.entityController.find(this.entityType, conditions, options);
      this.offset = this.chunk[XS_P_$OFFSET];
      this.size = this.size + this.chunk.length;
      // calc next offset
      this.offset = this.offset + this.getOptions().size;
      this.count = this.chunk[XS_P_$COUNT];
      this.logger.debug('reader fetched: length=' + this.chunk.length + ' size=' + this.size +
        ' count=' + this.count + ' duration= ' + (Date.now() - start));

    }

  }
}
