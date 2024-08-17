import { IIndexSpan } from '../../lib/datanodes/IIndexSpan';
import { IScrollEvent } from './IScrollEvent';




export interface IInfiniteScrollApi {

  onItemsChange(boundries: IIndexSpan, scroll?: IScrollEvent): void;

}
