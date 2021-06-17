
import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

// Theme initialization
// import {THEMES} from './themes';
// import {STYLES} from './stylesheets';
// import {ThemeRegistry} from '@typexs/ng';
// ThemeRegistry.register(THEMES, STYLES);

import {AppModule} from './../modules/app/module';
import {environment} from './environments/environment';
// import {FORM_ELEMENTS} from '@typexs/ng';


if (environment.production) {
  enableProdMode();
}


// TODO theme selection of themes which are enabled in local and thrid party packages.
/**
 * themes must be defined under src/app/themes
 * - use require for fetching the theme files, so this can be translated in p
 * - define enables themes in componentRegistryService/typexs
 * -
 */

platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
