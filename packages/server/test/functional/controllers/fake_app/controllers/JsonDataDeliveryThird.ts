import {Get, JsonController} from 'routing-controllers';


@JsonController()
export class JsonDataDeliveryThird {

  @Get('/get')
  get() {
    return {json: 'test'};
  }

}


