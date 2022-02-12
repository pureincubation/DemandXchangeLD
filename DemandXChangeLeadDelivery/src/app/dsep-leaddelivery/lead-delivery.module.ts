import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialAngularModule } from '../../material.angular.module';
import { DSEPComponentModule } from '../../_shared/dsep-components/v0.2/dsep-components.module';
import { LeadDetailTableComponent } from './lead-delivery-details/lead-delivery-details-table/lead-delivery-detail-table.component';
import { LeadDetailsComponent } from './lead-delivery-details/lead-delivery-details.component';
import { LeadDeliveryMainComponent } from './lead-delivery-main/lead-delivery.component';
import { DeliveredLeadsComponent } from './lead-delivery-details/delivered-leads/delivered-leads.component';
import { LeadDeliveryDetailsChannelComponent } from './lead-delivery-details/lead-delivery-details-channel/lead-delivery-details-channel.component';
import { CampaignProgressAllocationComponent } from './lead-delivery-details/campaign-progress-allocation/campaign-progress-allocation.component';
import { PortalRouteResolver } from '../../_core/portalRoute.resolver';
import { HasClaimDirective } from '../../_directives/dsep-portal-claim.directive';
import { FilePreviewComponent } from './lead-delivery-details/file-preview/file-preview.component';
import { LeadDeliveryAuthGuard } from './_guards/leadDetailsAuthGuard';
import { LeadDeliveryDetailsResolver } from './_guards/leadDetailsDataResolver';
import { LeadDeliveryMainResolver } from './_guards/leadMainDataResolver';
import { LeadMainAuthGuard } from './_guards/leadMainAuthGuard';
import { LeadDeliveryDetailsWidgetDataResolver } from './_guards/leadDetailsWidgetDataResolver';
import { LeadExportDownloader } from './lead-delivery-details/lead-export-downloader/lead-export-downloader';

@NgModule({
  declarations: [
    LeadDeliveryMainComponent,
    LeadDetailsComponent,
    LeadDetailTableComponent,
    DeliveredLeadsComponent,
    LeadDeliveryDetailsChannelComponent,
    CampaignProgressAllocationComponent,
    FilePreviewComponent,
    HasClaimDirective,
    LeadExportDownloader
  ],
  imports: [
    CommonModule,
    RouterModule,
    DSEPComponentModule,
    MaterialAngularModule,
    RouterModule.forChild([
      { path: '', redirectTo:'default', data: { claimType: "leadDelivery" }, canActivate: [LeadDeliveryAuthGuard], pathMatch: 'full' },
      { path: 'default', data: {  claimType: "leadDelivery" }, canActivate: [LeadDeliveryAuthGuard], component: LeadDeliveryMainComponent },
      { path: 'exportFile', component: LeadExportDownloader, canActivate: [LeadMainAuthGuard]},  
      { path: ':id', data: {  claimType: "leadDelivery" }, 
                      resolve: { directData: LeadDeliveryMainResolver}, 
                      canActivate: [LeadMainAuthGuard], component: LeadDeliveryMainComponent },
      { path: 'leadDetails/:id', data: { claimType: "leadDelivery" }, resolve: { campaignData: LeadDeliveryDetailsResolver }, canActivate: [LeadDeliveryAuthGuard], component: LeadDetailsComponent}
    ]),
  ],
  exports: [
    RouterModule,
    CommonModule,
    LeadDeliveryMainComponent,
    LeadDetailsComponent,
    CampaignProgressAllocationComponent,
    LeadExportDownloader
  ],
  providers: [LeadDeliveryAuthGuard, LeadMainAuthGuard],
  bootstrap: [],
  entryComponents: [

  ]
})
export class LeadDeliveryModule { }
