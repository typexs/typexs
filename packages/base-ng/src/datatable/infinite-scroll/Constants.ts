import { IIndexSpan } from '../../lib/datanodes/IIndexSpan';

export interface IViewCheckOptions {
  height: number;
  margin: number;
}


export interface IViewCheckParamCapture {
  span?: IIndexSpan,
  offsetTop?: number,
  nTopIdx?: number,
  nBottomIdx?: number,
  elemIdx?: number[]
}
