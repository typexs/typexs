import { range } from 'lodash';

export function generateData(startIdx: number, endIdx: number, limit: number) {
  if (typeof endIdx !== 'number') {
    endIdx = startIdx + limit;
  }
  return range(startIdx, endIdx + 1).map(x => ({
    id: x,
    name: 'Entry ' + x
  }));
}
