import { RenderMode } from '@angular/ssr';
import { appConfig } from './app.config';
import { config as serverConfig } from './app.config.server';
import { serverRoutes } from './app.routes.server';

describe('application configuration', () => {
  it('provides routing, http, the session store and effects', () => {
    expect(appConfig.providers.length).toBeGreaterThanOrEqual(8);
  });

  it('adds server rendering on top of the app providers', () => {
    expect(serverConfig.providers.length).toBeGreaterThan(appConfig.providers.length);
  });

  it('renders every route in the browser, where the session lives', () => {
    expect(serverRoutes).toEqual([{ path: '**', renderMode: RenderMode.Client }]);
  });
});
