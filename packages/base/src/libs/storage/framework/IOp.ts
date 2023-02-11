import { IEntityController } from '../IEntityController';

export interface IOp<OPTS> {

  getNamespace?(): string;

  getOptions(): OPTS;

  getController(): IEntityController;

}
