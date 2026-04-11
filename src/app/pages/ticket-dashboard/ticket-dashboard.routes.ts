import { Routes } from '@angular/router';
import { MainLayout } from '../../layouts/main-layout/main-layout';
import { TicketDashboard } from './ticket-dashboard';

export const ticketDashboardRoutes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', component: TicketDashboard },
    ],
  },
];
