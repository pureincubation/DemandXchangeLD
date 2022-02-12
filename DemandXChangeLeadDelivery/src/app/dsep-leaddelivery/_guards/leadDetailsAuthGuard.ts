import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { PortalAuthenticationService } from '../../../_services/dsep-portal-auth.service';

@Injectable()
export class LeadDeliveryAuthGuard implements CanActivate {
  constructor(private authSvc: PortalAuthenticationService,
    private router: Router) { }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    // Get property name on security object to check
    let claimType: string = next.data["claimType"];

    if (this.authSvc.loggedOnUser.isAuthenticated
      && this.authSvc.hasClaim(claimType, "canRead")) {
      return true;
    }
    else {
      this.router.navigate(['unauthorized'],
        { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
