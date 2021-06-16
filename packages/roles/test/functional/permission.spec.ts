import {expect} from 'chai';
import {suite, test} from '@testdeck/mocha';
import {BasicPermission, PermissionHelper} from '@typexs/roles-api';


@suite('functional/permission')
class PermissionSpec {

  @test()
  'basic'() {
    let p = new BasicPermission('test');
    expect(p.permission).to.be.eq('test');
    expect(p.type).to.be.eq('single');

    p = new BasicPermission('test * object');
    expect(p.permission).to.be.eq('test * object');
    expect(p.type).to.be.eq('pattern');

    p = new BasicPermission('test object');
    expect(p.permission).to.be.eq('test object');
    expect(p.type).to.be.eq('single');
  }

  @test()
  async 'check single permission'() {
    let r = await PermissionHelper.checkPermission(['a', 'b', 'c'], 'a');
    expect(r).to.be.true;
    r = await PermissionHelper.checkPermission(['a', 'b', 'c'], 'd');
    expect(r).to.be.false;
  }

  @test()
  async 'check for one permission'() {
    let r = await PermissionHelper.checkOnePermission(['a', 'b', 'c'], ['a']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['a', 'b', 'c'], ['a', 'b']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['a', 'b', 'c'], ['a', 'd']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['a', 'b', 'c'], ['d']);
    expect(r).to.be.false;
    r = await PermissionHelper.checkOnePermission(['a', 'b', 'c'], ['d', 'e']);
    expect(r).to.be.false;
  }


  @test()
  async 'check for one permission with pattern'() {
    let r = await PermissionHelper.checkOnePermission(['best test', 'news access', 'car open'], ['allow thing']);
    expect(r).to.be.false;
    r = await PermissionHelper.checkOnePermission(['best test', 'allow *', 'car open'], ['allow thing']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['best test', '* thing', 'car open'], ['allow thing']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['best test', '* thin', 'car open'], ['allow thing']);
    expect(r).to.be.false;
    r = await PermissionHelper.checkOnePermission(['best test', '* thing great', 'car open'], ['allow thing *']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkOnePermission(['best test', '* thing great', 'car open'], ['allow thinger *']);
    expect(r).to.be.false;
  }


  @test()
  async 'check for all permission'() {
    let r = await PermissionHelper.checkAllPermissions(['a', 'b', 'c'], ['a']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkAllPermissions(['a', 'b', 'c'], ['a', 'b']);
    expect(r).to.be.true;
    r = await PermissionHelper.checkAllPermissions(['a', 'b', 'c'], ['a', 'd']);
    expect(r).to.be.false;
  }

}
