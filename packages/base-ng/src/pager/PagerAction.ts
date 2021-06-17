export class PagerAction {
  name: string;
  page: number;
  type: string;

  constructor(page: number, id: string, type: string = 'set') {
    this.name = id;
    this.page = page;
    this.type = type;
  }


}
