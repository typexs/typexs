export interface IOp<OPTS> {

  getNamespace?(): string;

  getOptions(): OPTS;
}
