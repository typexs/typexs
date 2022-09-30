// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html
function isCurrentUserRoot() {
    return process.getuid() == 0; // UID 0 is always root
}

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [
      { pattern: 'src/*.spec.ts', watched: true, included: true, served: true },
      { pattern: 'src/**/*.spec.ts', watched: true, included: true, served: true }
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    coverage: {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      dir: require('path').join(__dirname, './coverage/app-auth'),
      reports: ['html', 'lcovonly', 'text-summary'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [isCurrentUserRoot() ? 'ChromeHeadlessNoSandbox' : 'ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    singleRun: false,
    restartOnFileChange: true
  });
};


