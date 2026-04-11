import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { PermissionModule, PermissionAction } from '../../core/models/permission';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private authService = inject(AuthService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private isRendered = false;

  private module = signal<PermissionModule | null>(null);
  private action = signal<PermissionAction | null>(null);

  @Input() set appHasPermission(value: [PermissionModule, PermissionAction]) {
    this.module.set(value[0]);
    this.action.set(value[1]);
    this.updateView();
  }

  private updateView(): void {
    const mod = this.module();
    const act = this.action();
    if (!mod || !act) return;

    const hasPermission = this.authService.hasPermission(mod, act);

    if (hasPermission && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!hasPermission && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
