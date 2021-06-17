import {Form} from './elements/Form';


export interface IResolver {
  resolve(form: Form): void;
}
