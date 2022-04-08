export interface IButton {
  type: 'submit' | 'reset' | 'button' | 'restore';
  key: string;
  label: string;
}


export interface IFormOptions {

  /**
   * Only decorated field should be displayed and handelt in the form
   */
  onlyDecoratedFields?: boolean;

  buttons?: IButton[];
}
