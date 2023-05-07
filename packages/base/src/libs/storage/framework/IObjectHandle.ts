export interface IObjectHandle<T> {


  save(obj: T, options?: any): Promise<T>;
  save(obj: T[], options?: any): Promise<T[]>;
  save(obj: T | T[], options?: any): Promise<T | T[]>;

  count(conditions: any): Promise<number>;

  aggregate(clonePipeline: any[]): Promise<any>;

  deleteByCondition(condition: any): Promise<number>;

  remove(obj: T[], opts?: any): Promise<any>;

  updateByCondition(condition: any, update: any, options: any): Promise<number>;

  find(condition?: any, opts?: any): Promise<T[]>;

  findOne(condition?: any, opts?: any): Promise<T>;
}
