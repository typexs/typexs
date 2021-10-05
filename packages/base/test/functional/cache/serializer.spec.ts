import { expect } from 'chai';
import { suite, test } from '@testdeck/mocha';
import { Serializer } from '../../../src/libs/cache/Serializer';


class HalloWelt {
  param: string;

}


class HandleDate {
  date: Date;

}

class HalloWeltEmbedded {
  elem: HalloWelt;

}


class HalloWeltEmbeddedArray {
  elems: HalloWelt[];

}


@suite('functional/cache/serializer')
class SerializerSpec {


  @test
  async 'string'() {
    const data = 'hallo';
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
  }

  @test
  async 'object'() {
    const data = { hallo: 'welt' };
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
  }

  @test
  async 'simple class'() {
    const data = new HalloWelt();
    data.param = 'hallo';
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
    expect(r).instanceOf(HalloWelt);
  }

  @test
  async 'embedded class'() {
    const data = new HalloWeltEmbedded();
    data.elem = new HalloWelt();
    data.elem.param = 'Hallo';
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
    expect(r).instanceOf(HalloWeltEmbedded);
    expect(r.elem).instanceOf(HalloWelt);
  }


  @test
  async 'embedded array class'() {
    const data = new HalloWeltEmbeddedArray();
    data.elems = [new HalloWelt(), new HalloWelt()];
    data.elems[0].param = 'Hallo1';
    data.elems[1].param = 'Hallo2';
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
    expect(r).instanceOf(HalloWeltEmbeddedArray);
    expect(r.elems[0]).instanceOf(HalloWelt);
    expect(r.elems[1]).instanceOf(HalloWelt);
  }



  @test
  async 'class with date'() {
    const data = new HandleDate();
    data.date = new Date();
    const x = Serializer.serialize(data);
    const r = Serializer.deserialize(x);
    expect(data).to.be.deep.eq(r);
    expect(r).instanceOf(HandleDate);
  }

}

