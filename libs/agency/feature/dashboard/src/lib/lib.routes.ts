import { Route } from '@angular/router';

export const agencyFeatureDashboardRoutes: Route[] = [
  {
    loadComponent: () => import('./components/dashboard').then(module => module.DashboardComponent),
    path: '',
  },
  {
    children: [
      {
        data: { activeTab: 'notes' },
        loadComponent: () => import('./components/notes').then(module => module.NotesComponent),
        path: 'notes',
      },
      {
        data: { activeTab: 'notes' },
        loadComponent: () => import('./components/notes/note-form').then(module => module.NoteFormComponent),
        path: 'notes/add-note',
      },
      {
        loadComponent: () => import('./components/notes/note-form').then(module => module.NoteFormComponent),
        path: 'notes/:noteId',
      },
      {
        data: { activeTab: 'events' },
        loadComponent: () => import('./components/events-log').then(module => module.EventsLogComponent),
        path: 'events',
      },
      {
        data: { activeTab: 'review' },
        loadComponent: () => import('./components/review').then(module => module.ReviewFormComponent),
        path: '',
      },
      { path: '**', redirectTo: '' },
    ],
    loadComponent: () => import('./components/transaction-detail').then(module => module.TransactionDetailComponent),
    path: 'transaction/:transactionId',
  },
  { path: '**', redirectTo: '' },
];
