import { Directive, Input, TemplateRef, ViewContainerRef, inject, signal } from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private isRendered = false;

  private permission = signal<string | null>(null);

  @Input() set appHasPermission(value: string) {
    this.permission.set(value);
    this.updateView();
  }

  private updateView(): void {
    const perm = this.permission();
    if (!perm) return;

    const hasPermission = this.permissionService.hasPermission(perm);

    if (hasPermission && !this.isRendered) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.isRendered = true;
    } else if (!hasPermission && this.isRendered) {
      this.viewContainer.clear();
      this.isRendered = false;
    }
  }
}
