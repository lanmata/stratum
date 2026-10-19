import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    // The session lives in localStorage, which the server cannot see: rendering authenticated
    // pages on the server makes their API calls fail and the components redirect away.
    renderMode: RenderMode.Client,
  },
];
