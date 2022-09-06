import { UnitTestTree } from '@angular-devkit/schematics/testing';

import {
  createMigrationTestRunner,
  createWorkspace,
  VERSION,
} from '../../test-utils';

const workspaceOptions = {
  name: 'ss-workspace',
  newProjectRoot: 'projects',
  version: VERSION,
};

const appOptions = {
  name: 'ss-angular-cli-app',
  prefix: 'test',
  inlineStyle: false,
  inlineTemplate: false,
  routing: true,
  skipTests: true,
  style: 'scss',
};

describe('ng-update migration-v5', () => {
  let appTree: UnitTestTree;
  const testRunner = createMigrationTestRunner();

  beforeEach(async () => {
    // Generate a basic Angular CLI application
    appTree = await createWorkspace(testRunner, appTree, workspaceOptions, appOptions);
  });

  test('should update main-single-spa.ts', async () => {
    appTree.overwrite(
      '/projects/ss-angular-cli-app/src/main.ts',
      `
import { ɵAnimationEngine as AnimationEngine } from '@angular/animations/browser';
import { enableProdMode, NgZone } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { singleSpaAngular } from 'single-spa-angular';
import { setPublicPath } from 'systemjs-webpack-interop';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { singleSpaPropsSubject } from './single-spa/single-spa-props';

setPublicPath('foo');

if (environment.production) {
  enableProdMode();
}

const lifecycles = singleSpaAngular({
  bootstrapFunction: (singleSpaProps) => {
    singleSpaPropsSubject.next(singleSpaProps);
    return platformBrowserDynamic().bootstrapModule(AppModule);
  },
  template: '<foo />',
  NgZone,
  AnimationEngine,
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;    
    `,
    );

    const before = appTree.read('/projects/ss-angular-cli-app/src/main.ts')?.toString();
    expect(before).toContain('AnimationEngine');

    const tree = await testRunner.runSchematicAsync('migration-v5', {}, appTree).toPromise();

    const after = tree.read('/projects/ss-angular-cli-app/src/main.ts')?.toString();
    expect(after).not.toContain('AnimationEngine');
  });
});
