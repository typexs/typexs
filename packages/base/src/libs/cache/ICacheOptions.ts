export interface ICacheOptions {
  [k: string]: any;
}

export interface ICacheGetOptions extends ICacheOptions {
  [k: string]: any;
}

export interface ICacheSetOptions extends ICacheOptions {
  ttl?: number;
}
