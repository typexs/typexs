/* eslint-disable */
'use strict';

const gulp = require('gulp');
const connect = require('gulp-connect');
const fs = require('fs');
const generator = require('@antora/site-generator-default');
const livereload = true;
// const { reload: livereload } = /*process.env.LIVERELOAD === 'false' ? {} :*/ require('gulp-connect');
const { series, src, watch } = require('gulp');
const yaml = require('js-yaml');
// const watch = require('gulp-watch');
const playbookFilename = 'docs/antora-playbook.yml';
const playbook = yaml.load(fs.readFileSync(playbookFilename, 'utf8'));
// const outputDir = (playbook.output || {}).dir || './build/public'
const outputDir = './build/docs';
const serverConfig = { name: 'Preview Site', livereload: livereload, port: 5005, root: outputDir };
const antoraArgs = ['--playbook', playbookFilename];
// const watchPatterns = playbook.content.sources.filter((source) => !source.url.includes(':')).reduce((accum, source) => {
//   // accum.push(`${source.url}/${source.start_path ? source.start_path + '/' : ''}antora.yml`)
//   // accum.push(`${source.url}/${source.start_path ? source.start_path + '/' : ''}**/*.adoc`)
//   accum.push(`./docs/**/*.adoc`)
//   accum.push(`./docs/antora.yml`)
//   return accum
// }, [])
const watchPatterns = [
  `./docs/**/*.adoc`,
  `./docs/antora.yml`,
  './packages/*/docs/**/*.adoc',
  './packages/*/docs/antora.yml'
];

function generate(done) {
  generator(antoraArgs, process.env)
    .then(() => {
      done();
    })
    .catch((err) => {
      console.log(err);
      done();
    });
}

gulp.task('html', function() {
  try {
    return src(outputDir, { read: false }).pipe(connect.reload());
  } catch (e) {
    console.error(e);
  }

});

gulp.task('docs-generate', generate);

function swallowError(error) {
  // If you want details of the error in the console
  console.error(error);
  this.emit('end');
}

function serve(done) {
  connect.server(serverConfig, function() {
    this.server.on('close', done);
    watch(watchPatterns, generate);
    watch(['./build/**'], { usePolling: true }, series('html')).on('error', swallowError);
  });
}


gulp.task('watch-doc', series(generate, serve));
