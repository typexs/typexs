export interface IButton {
  type: 'submit' | 'reset' | 'button' | 'restore';
  key: string;
  label: string;
}


export interface IFormOptions {
  buttons: IButton[];
}
