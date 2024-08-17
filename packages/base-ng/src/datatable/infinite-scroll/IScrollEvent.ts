import { IInfiniteScrollApi } from './IInfiniteScrollApi';

export type T_SCROLL = 'init' | 'bottom' | 'top' | 'scroll';

export interface IScrollEvent {

  /**
   * Which type of event fired
   * - bottom - reached bottom of the scroll area
   */
  type: T_SCROLL;

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
   * Node idx of top element
   */
  nTopIdx?: number;

  /**
   * Bottom position of the frame
   */
  bottom?: number;

  /**
   * Node idx of bottom element
   */
  nBottomIdx?: number;

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
