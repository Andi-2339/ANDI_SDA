import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: 'home',
    children: [
      {
        path: 'landing',
        loadChildren: () =>
          import('./pages/landing/landing.routes').then(m => m.landingRoutes),
      },
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
    ],
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.routes').then(m => m.authRoutes),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./pages/home/home.routes').then(m => m.dashboardRoutes),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./pages/profile/profile.routes').then(m => m.profileRoutes),
  },
  {
    path: 'groups',
    canActivate: [authGuard, permissionGuard('groups', 'view')],
    loadChildren: () =>
      import('./pages/groups/groups.routes').then(m => m.groupsRoutes),
  },
  {
    path: 'groups/:groupId/users',
    canActivate: [authGuard, permissionGuard('users', 'view')],
    loadChildren: () =>
      import('./pages/group-users/group-users.routes').then(m => m.groupUsersRoutes),
  },
  {
    path: 'tickets',
    canActivate: [authGuard, permissionGuard('tickets', 'view')],
    loadChildren: () =>
      import('./pages/tickets/tickets.routes').then(m => m.ticketsRoutes),
  },
  {
    path: 'tickets/:groupId',
    canActivate: [authGuard, permissionGuard('tickets', 'view')],
    loadChildren: () =>
      import('./pages/tickets/tickets.routes').then(m => m.ticketsRoutes),
  },
  {
    path: 'ticket-dashboard',
    canActivate: [authGuard, permissionGuard('tickets', 'view')],
    loadChildren: () =>
      import('./pages/ticket-dashboard/ticket-dashboard.routes').then(m => m.ticketDashboardRoutes),
  },
  {
    path: 'ticket-dashboard/:groupId',
    canActivate: [authGuard, permissionGuard('tickets', 'view')],
    loadChildren: () =>
      import('./pages/ticket-dashboard/ticket-dashboard.routes').then(m => m.ticketDashboardRoutes),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, permissionGuard('users', 'add')],
    loadChildren: () =>
      import('./pages/admin-users/admin-users.routes').then(m => m.adminUsersRoutes),
  },
  { path: '', redirectTo: 'home/landing', pathMatch: 'full' },
  { path: '**', redirectTo: 'home/landing' },
];
