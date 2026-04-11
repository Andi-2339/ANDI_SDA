import { Component, output, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { PermissionModule, PermissionAction } from '../../core/models/permission';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permission?: [PermissionModule, PermissionAction];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ButtonModule, RippleModule, TooltipModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private authService = inject(AuthService);

  collapsed = signal(false);
  collapsedChange = output<boolean>();

  appVersion = 'v0.0.3';

  currentUser = this.authService.currentUser;

  private allMenuItems: MenuItem[] = [
    { label: 'Perfil', icon: 'pi pi-user', route: '/profile' },
    { label: 'Grupos', icon: 'pi pi-users', route: '/groups', permission: ['groups', 'view'] },
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/tickets', permission: ['tickets', 'view'] },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/ticket-dashboard', permission: ['tickets', 'view'] },
    { label: 'Usuarios', icon: 'pi pi-id-card', route: '/admin/users', permission: ['users', 'add'] },
  ];

  menuItems = computed(() => {
    return this.allMenuItems.filter((item) => {
      if (!item.permission) return true;
      return this.authService.hasPermission(item.permission[0], item.permission[1]);
    });
  });

  toggleSidebar(): void {
    this.collapsed.set(!this.collapsed());
    this.collapsedChange.emit(this.collapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}
