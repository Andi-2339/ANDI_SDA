import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { AdminUsers } from './admin-users';

export const adminUsersRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: AdminUsers },
    ],
  },
];
