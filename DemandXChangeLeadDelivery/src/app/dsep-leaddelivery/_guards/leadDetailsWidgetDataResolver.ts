import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { LeadDetailsService } from '../_services/lead-delivery-details.service';

@Injectable({
  providedIn: 'root'
})
export class LeadDeliveryDetailsWidgetDataResolver implements Resolve<Observable<{}>> {
  constructor(private leadDetailsSvc: LeadDetailsService){}
  resolve(route: ActivatedRouteSnapshot): Observable<{}> {
    return this.leadDetailsSvc.getMonthlyPacing({AdminCampaignId: +route.params.id.substring(4)});
  }
}