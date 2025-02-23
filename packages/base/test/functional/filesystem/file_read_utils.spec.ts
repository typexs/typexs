import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {FileReadUtils} from '../../../src/libs/filesystem/FileReadUtils';
import {FileUtils} from '@allgemein/base';


const filename = __dirname + '/data/data_01.txt';
const filenameLarge = __dirname + '/data/task-worker.log';

@suite('functional/filesystem/file_read_utils')
class FileReadUtilsSpec {


  @test
  async 'tail file content'() {
    let tailed: any = await FileReadUtils.tail(filename, 5);
    expect(tailed.split('\n')).to.have.length(6);
    expect(tailed).to.contain('delenit augue duis dolore te feugait nulla facilisi.\n');

    tailed = <string>await FileReadUtils.tail(filename, 2);
    expect(tailed.split('\n')).to.have.length(3);
    expect(tailed).to.contain('delenit augue duis dolore te feugait nulla facilisi.\n');

    const path = __dirname + '/data/tail_oneline_test.log';
    await FileUtils.writeFileSync(path, 'delenit augue duis dolore te feugait nulla facilisi.');
    tailed = <string>await FileReadUtils.tail(path, 1);
    expect(tailed).to.be.eq('delenit augue duis dolore te feugait nulla facilisi.');
  }

  @test
  async 'less first line'() {
    const firstLine: string = <string>await FileReadUtils.less(filename, 0, 1);
    expect(firstLine.split('\n')).to.have.length(1);
    expect(firstLine).to.contain('Lorem ipsum dolor sit amet, consetetur sadipscing elitr,');
  }

  @test
  async 'less second line'() {
    const secondLine: string = <string>await FileReadUtils.less(filename, 1, 1);
    expect(secondLine.split('\n')).to.have.length(1);
    expect(secondLine).to.contain('sed diam nonumy eirmod tempor invidunt ut labore et dolore');
  }

  @test
  async 'less paragraph'() {
    const paragraph: string = <string>await FileReadUtils.less(filename, 14, 5);
    expect(paragraph.split('\n')).to.have.length(5);
    expect(paragraph).to.contain(
      'Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit\n' +
      'amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy\n' +
      'eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.\n' +
      'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd\n' +
      'gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem');
  }

  @test
  async 'less maxlines not reached'() {
    const end: string = <string>await FileReadUtils.less(filename, 35, 10);
    expect(end.split('\n')).to.have.length(2);
    expect(end).to.contain(
      'accumsan et iusto odio dignissim qui blandit praesent luptatum zzril\n' +
      'delenit augue duis dolore te feugait nulla facilisi.');
  }

  @test
  async 'less maxlines match exactly'() {

    const end2: string = <string>await FileReadUtils.less(filename, 35, 2);
    expect(end2.split('\n')).to.have.length(2);
    expect(end2).to.contain(
      'accumsan et iusto odio dignissim qui blandit praesent luptatum zzril\n' +
      'delenit augue duis dolore te feugait nulla facilisi.');
  }

  @test
  async 'less load all'() {
    const all: string = <string>await FileReadUtils.less(filename, 0, 0);
    expect(all.split('\n')).to.have.length(37);
  }

  @test
  async 'less from given value to the end'() {
    const allFrom: string = <string>await FileReadUtils.less(filename, 10, 0);
    expect(allFrom.split('\n')).to.have.length(27);
  }

  @test
  async 'less larger file'() {
    const allFrom: string = <string>await FileReadUtils.less(filenameLarge, 0, 0);
    expect(allFrom.split('\n')).to.have.length(2005);
  }

}
