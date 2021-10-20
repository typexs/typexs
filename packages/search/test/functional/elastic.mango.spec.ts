import {suite, test, timeout} from '@testdeck/mocha';
import {ElasticMangoWalker} from '../../src/lib/elastic/ElasticMangoWalker';
import {expect} from 'chai';

@suite('functional/elastic/mango')
class ElasticMangoSpec {


  @test
  async '$eq string value'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({keyS: {$eq: 'valueS'}});
    expect(esQuery).to.be.deep.eq({query: {term: {keyS: {value: 'valueS'}}}});

  }


  @test
  async '$regex string value'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({keyS: {$regex: 'valueS'}});
    expect(esQuery).to.be.deep.eq({
      query: {
        regexp: {
          keyS: {
            value: 'valueS',
            'case_insensitive': true,
            'flags': 'ALL'
          }
        }
      }
    });
  }


  @test
  async '$like string value'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({keyS: {$like: 'valueS'}});
    expect(esQuery).to.be.deep.eq({
      'query': {
        'match': {
          'keyS': {
            'operator': 'and',
            'query': 'valueS'
          }
        }
      }
    });

  }

  @test
  async '$eq array of string values'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({keyS: {$eq: 'valueS'}, keyS2: {$eq: 'valueS2'}});
    expect(esQuery).to.be.deep.eq({
      query: {
        bool: {
          must: [
            {term: {keyS: {value: 'valueS'}}},
            {term: {keyS2: {value: 'valueS2'}}}
          ]
        }
      }
    });

  }


  @test
  async '$and operator simple'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({$and: [{keyS: {$eq: 'valueS'}}, {keyS2: {$eq: 'valueS2'}}]});
    expect(esQuery).to.be.deep.eq({
      query: {
        bool: {
          must: [
            {term: {keyS: {value: 'valueS'}}},
            {term: {keyS2: {value: 'valueS2'}}}
          ]
        }
      }
    });

  }


  @test
  async '$or operator simple'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({$or: [{keyS: {$eq: 'valueS'}}, {keyS2: {$eq: 'valueS2'}}]});
    expect(esQuery).to.be.deep.eq({
      query: {
        bool: {
          should: [
            {term: {keyS: {value: 'valueS'}}},
            {term: {keyS2: {value: 'valueS2'}}}
          ]
        }
      }
    });

  }


  @test
  async '$or in combination with $and'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({$or: [{$and: [{keyS3: {$eq: '1'}}, {keyS4: {$eq: '2'}}]}, {keyS2: {$eq: 'valueS2'}}]});
    expect(esQuery).to.be.deep.eq({
      query: {
        bool: {
          must: [
            {term: {keyS3: {value: '1'}}},
            {term: {keyS4: {value: '2'}}}
          ],
          should: [
            {term: {keyS2: {value: 'valueS2'}}}
          ]
        }
      }
    });

  }

  @test
  async '$and in combination with $or'() {
    const expr = new ElasticMangoWalker();
    const esQuery = expr.build({$and: [{$or: [{keyS3: {$eq: '1'}}, {keyS4: {$eq: '2'}}]}, {keyS2: {$eq: 'valueS2'}}]});
    expect(esQuery).to.be.deep.eq({
      query: {
        bool: {
          must: [
            {term: {keyS2: {value: 'valueS2'}}}
          ],
          should: [
            {term: {keyS3: {value: '1'}}},
            {term: {keyS4: {value: '2'}}}
          ],
        }
      }
    });

  }

  // TODO
  // $in -> multi term, multi match?
  // $gt
  // $gte / $ge
  // $lt
  // $lte / $le

}
