export interface IPullable {

  hasNext(): boolean | Promise<boolean>;

  doFetch(): void;
}
