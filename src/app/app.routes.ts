import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/welcome/welcome.component').then(m => m.WelcomeComponent)
  },
  {
    path: 'inbox',
    loadComponent: () => import('./components/inbox/inbox.component').then(m => m.InboxComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
