import {IMessage} from './IMessage';
import {BehaviorSubject, Subscription} from 'rxjs';

export class MessageChannel<T extends IMessage> {

  private name: string;

  private subject: BehaviorSubject<T> = new BehaviorSubject<T>(null);


  constructor(name: string) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  publish(message: T) {
    this.subject.next(message);
  }


  subscribe(next?: (message: T) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    return this.subject.subscribe(next, error, complete);
  }

  finish() {
    this.subject.complete();
  }

}
