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

  /**
   * Top position of the frame
   */
  top?: number;

  /**
   * Bottom position of the frame
   */
  bottom?: number;

  /**
   * Index of elements which should be loaded based on calculation
   */
  loadIdx?: number[];

  /**
   * Offset between root element and single node
   */
  diff?: number;

  /**
   * Signales in which direction the scrolling goes
   */
  direction?: 'up' | 'down' | 'none';

}
