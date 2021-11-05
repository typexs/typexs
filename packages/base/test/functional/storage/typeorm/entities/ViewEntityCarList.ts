import { ViewColumn, ViewEntity } from 'typeorm';

@ViewEntity({
  expression: 'select id, name from Car'
})
export class ViewEntityCarList {

  @ViewColumn()
  id: number;

  @ViewColumn()
  name: string;

}
