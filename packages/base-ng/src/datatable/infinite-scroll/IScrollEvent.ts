import { IInfiniteScrollApi } from './IInfiniteScrollApi';

export interface IScrollEvent {

  /**
   * Which type of event fired
   * - bottom - reached bottom of the scroll area
   */
  type: 'bottom' | 'top' | 'scroll';

  /**
   * Api to the infinite scroll directive
   */
  api: IInfiniteScrollApi;

  /**
   * Index of elements in frame
   */
  idx?: number[];


}
