/**
 * Structure for register detected override / extends stylesheet
 */
export interface IStylesheetEntry {

  name: string;

  // can be 'css' | 'sass' | 'less'
  type: string;

  // can be override or append
  subcontext: string;

  theme: string;

  stylesheet: any;

  module?: string;

}
