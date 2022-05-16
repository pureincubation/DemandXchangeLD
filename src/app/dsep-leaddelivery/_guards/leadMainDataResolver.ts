import { Injectable } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, Resolve, Router } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LeadDeliveryMainResolver implements Resolve<{}> {
  constructor(){}
  resolve(route: ActivatedRouteSnapshot) {
    return {
            PXSegmentId: route.params.id,
            CampaignDue: 1
        }
  }
}