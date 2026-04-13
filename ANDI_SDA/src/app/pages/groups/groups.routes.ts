import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { Groups } from './groups';

export const groupsRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Groups },
    ],
  },
];
