import {Select, Text} from '@typexs/ng';
import {Property} from '@typexs/schema/libs/decorators/Property';


export class Places {

  @Text()
  @Property({type: 'string'})
  country: string;

  @Text()
  @Property({type: 'string'})
  city: string;

  @Select({enum: 'continents'})
  @Property(<any>{type: 'string', label: 'Continent'})
  continent: string;

  continents: string[] = ['Africa', 'Europa', 'Asia', 'Australia', 'North america', 'South america', 'Antarctica'];


}
