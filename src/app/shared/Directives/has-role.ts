import { Directive, Input } from '@angular/core';
import { PermissionFacade } from '../../core/Auth/services/permission-facade';
import { RoleFacade } from '../../core/Auth/services/role-facade';

@Directive({
  selector: '[appHasRole]'
})
export class HasRole {

  constructor(private roleFacade: RoleFacade) { }

  @Input({ required: true }) role!: string;
  @Input({ required: true }) UserId!: string;

  ngOnInit() {
    // this.roleFacade.getAllRoles().subscribe((roles) => {
    //   const hasRole = roles.data?.some((r) => r.name === this.role);
    //   if (!hasRole) {
    //     const element = (this as any).el.nativeElement;
    //     element.style.display = 'none';
    //   }
    // });
  }

}
