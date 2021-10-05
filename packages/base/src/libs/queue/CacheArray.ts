import { ClassType } from '@allgemein/schema-api';
import { ICache } from '../cache/ICache';
import { IQueueArray } from './IQueueArray';
import { IdObject } from './IdObject';


export class CacheArray<T extends IdObject> implements IQueueArray<T> {

  // id: string;

  cache: ICache;

  classType: ClassType<T>;

  ids: { id: string; ts: number } [] = [];

  constructor(cache: ICache, classType: ClassType<T>) {
    // this.id = CryptUtils.shorthash('cached-array-' + new Date().getTime());
    this.cache = cache;
    this.classType = classType;
  }

  shift(): Promise<T> {
    const id = this.ids.shift();
    return this.get(id.id);
  }

  pop(): Promise<T> {
    const id = this.ids.pop();
    return this.get(id.id);
  }

  async get(id: string) {
    const e = this.ids.find(x => x.id === id);
    if (!e) {
      return null;
    }
    const data = await this.cache.get(id) as string;
    if (!data) {
      return null;
    }
    return <T><any>data;
    // const x = Reflect.construct(this.classType, []);
    // assign(x, JsonUtils.parse(data));
    // return x;
  }


  async set(x: T) {
    const e = this.ids.find(y => y.id === x.id);
    if (!e) {
      this.ids.push({ id: x.id, ts: (new Date().getTime()) });
    } else {
      e.ts = (new Date().getTime());
    }
    // const y = JsonUtils.stringify(x);
    await this.cache.set(x.id, x);
    return x;
  }


  async push(x: T) {
    return this.set(x);
  }

  get length() {
    return this.ids.length;
  }

  async map(fn: Function): Promise<any[]> {
    const res = [];
    for (const id of this.ids) {
      const entry = await this.get(id.id);
      res.push(fn(entry));
    }
    return res;
  }

  async remove(id: string) {
    const idx = this.ids.findIndex(y => y.id === id);
    this.ids.splice(idx, 1);
    await this.cache.set(id, null);
  }


}
