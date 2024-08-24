import { EntityResolverService } from './entity-resolver.service';
import { getTestBed, TestBed } from '@angular/core/testing';
import { Entity, Property } from '@allgemein/schema-api';
import { Log } from '../lib/log/Log';

@Entity()
export class AnnoObjWithId {

  @Property({ id: true })
  someId: string;

}

export class ObjWithPredefinedId {

  _id: string;

}


export class SomeObj {

  name: string;

}

/**
 * EntityResolverService
 * ---------------
 *
 * - check id generation
 *
 */
describe('service: EntityResolverService', () => {
  let service: EntityResolverService;
  let injector: TestBed;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        EntityResolverService
      ]
    });

    injector = getTestBed();
    service = injector.get(EntityResolverService);
    Log.debug = console.log.bind(console);
  });


  afterEach(() => {

  });


  it('should have a service instance', () => {
    expect(service).not.toBeNull();

  });


  it('get ids by predefined keys (optional=true)', () => {
    const preObj = new ObjWithPredefinedId();
    preObj._id = 'Id1';
    const id = service.getIdKeysFor(preObj, { idKeys: [{ key: '_id', optional: true }] });
    expect(id).toEqual({ _id: 'Id1' });
  });

  it('get ids by predefined keys (optional=false)', () => {
    const preObj = new ObjWithPredefinedId();
    preObj._id = 'Id1';
    const id = service.getIdKeysFor(preObj, { idKeys: [{ key: '_id', optional: false }] });
    expect(id).toEqual({ _id: 'Id1' });
  });

  it('fail to get ids by predefined keys (optional=false)', () => {
    const preObj = new SomeObj();
    preObj.name = 'Id1';
    expect(function() {
      service.getIdKeysFor(preObj, { idKeys: [{ key: '_id', optional: false }] });
    })
      .toThrow(new Error('Can\'t resolve fixed key {"key":"_id","optional":false} for object {"name":"Id1"}'));
  });

});
