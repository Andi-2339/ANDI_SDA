import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { GroupUsers } from './group-users';

export const groupUsersRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: GroupUsers },
    ],
  },
];
