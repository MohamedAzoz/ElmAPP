import { Directive, inject, TemplateRef, ViewContainerRef, Input, effect, signal } from "@angular/core";
import { PermissionFacade } from "../../core/Auth/services/permission-facade";

@Directive({
  selector: '[appHasPermission]',
  standalone: true // ضروري جداً
})
export class HasPermission {
  private permissionFacade = inject(PermissionFacade);
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  
  private pName = signal<string>('');

  @Input() set appHasPermission(val: string) {
    this.pName.set(val);
  }

  constructor() {
    effect(() => {
      // الـ effect الآن يراقب شيئين: اسم الصلاحية وتغيرات الـ Permissions في الـ facade
      const currentPerm = this.pName();
      const hasAccess = this.permissionFacade.hasPermission(currentPerm);
      
      this.viewContainer.clear();
      if (hasAccess) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}