import { IValueProvider } from '@typexs/tasks';
import { IPropertyRef } from '@allgemein/schema-api';
import { ExprDesc } from '@allgemein/expressions';

export class VProvider implements IValueProvider<string[]> {
  get(entity?: any, property?: IPropertyRef, hint?: ExprDesc): string[] {
    return ['VP-One1', 'VP-Two2', 'VP-Tree3'];
  }
}
