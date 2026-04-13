import { Component, output, signal, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { AuthService } from '../../core/services/auth.service';
import { PermissionModule, PermissionAction } from '../../core/models/permission';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  category: 'Menu' | 'Admin';
  permission?: [PermissionModule, PermissionAction];
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FormsModule, ButtonModule, RippleModule, TooltipModule, SelectModule],
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
    { label: 'Perfil', icon: 'pi pi-user', route: '/profile', category: 'Menu' },
    { label: 'Dashboard', icon: 'pi pi-chart-bar', route: '/ticket-dashboard', permission: ['tickets', 'view'], category: 'Menu' },
    { label: 'Grupos', icon: 'pi pi-users', route: '/groups', permission: ['groups', 'view'], category: 'Admin' },
    { label: 'Tickets', icon: 'pi pi-ticket', route: '/tickets', permission: ['tickets', 'view'], category: 'Menu' },
    { label: 'Usuarios', icon: 'pi pi-id-card', route: '/admin/users', permission: ['users', 'add'], category: 'Admin' },
  ];

  menuItems = computed(() => {
    return this.allMenuItems.filter((item) => {
      if (!item.permission) return true;
      return this.authService.hasPermission(item.permission[0], item.permission[1]);
    });
  });

  menuCategories = ['Menu', 'Admin'];

  getMenuItemsByCategory(category: string) {
    return this.menuItems().filter(item => item.category === category);
  }

  groupOptions = computed(() => {
    const user = this.currentUser();
    if (!user || !user.memberships) return [];
    return user.memberships.map(m => ({
      label: m.groups?.nombre || `Grupo ${m.group_id}`,
      value: m.group_id
    }));
  });

  get activeGroupId() {
    return this.currentUser()?.activeGroupId;
  }

  set activeGroupId(id: number | undefined) {
    if (id !== undefined) {
      this.authService.setActiveGroup(id);
    }
  }

  toggleSidebar(): void {
    this.collapsed.set(!this.collapsed());
    this.collapsedChange.emit(this.collapsed());
  }

  logout(): void {
    this.authService.logout();
  }
}
