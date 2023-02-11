export interface IInstanceableComponent<T> {


  getOptions?(): any;

  setOptions?(opts: any): void;


  getViewContext?(): string;

  setViewContext?(context: string): void;

  getInstance(): any;

  setInstance(instance: T): void;

  // getViewContainerRef(): ViewContainerRef;

}
