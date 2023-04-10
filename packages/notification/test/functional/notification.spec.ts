import { suite, test } from '@testdeck/mocha';
import { expect } from 'chai';

@suite('functional/notification')
export class NotificationSpec {

  @test
  async 'todo'() {
    expect(true).to.be.true;
  }
}
