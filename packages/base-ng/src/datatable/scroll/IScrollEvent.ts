import { IInfiniteScrollApi } from './IInfiniteScrollApi';

export interface IScrollEvent {

  type: 'bottom' | 'top' | 'scroll';

  source: IInfiniteScrollApi;


}
