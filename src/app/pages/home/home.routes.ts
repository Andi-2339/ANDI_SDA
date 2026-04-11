import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { Home } from './home';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Home },
    ],
  },
];
