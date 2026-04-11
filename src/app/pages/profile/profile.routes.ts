import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { Profile } from './profile';

export const profileRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: Profile },
    ],
  },
];
