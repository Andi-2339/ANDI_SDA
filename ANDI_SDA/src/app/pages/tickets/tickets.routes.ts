import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { Tickets } from './tickets';

export const ticketsRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Tickets },
    ],
  },
];
