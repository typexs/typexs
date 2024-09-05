export interface IParamsOverride {
  offset?: number;
  limit?: number;
  sort?: { [k: string]: 'asc' | 'desc' };
}
