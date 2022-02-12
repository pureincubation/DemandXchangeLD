import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { empty } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { NotificationsService } from '../../../../notifications/notifications.service';
import { LeadDetailsService } from '../../_services/lead-delivery-details.service';
import { LeadDeliveryService } from '../../_services/lead-delivery.service';

@Component({
  selector: 'pof-downloads',
  template: `<div class="container-fluid" style="padding: 15px;">
  <div>
    <h2 class="label-type-1 inline-header">Export Leads download file</h2>
  </div>
  <hr />

  <div class="col-12">
    {{message}}
  </div>

</div>`
})
export class LeadExportDownloader implements OnInit {
  private progressBarSessionId: number;
  message: string = '';

  constructor(private notificationSvc: NotificationsService,
    private router: Router,
    private route: ActivatedRoute,
    private leadService: LeadDetailsService) { }

  ngOnInit() {

    this.progressBarSessionId = this.notificationSvc.setPageBusy(true);

    let fileReference = this.route.snapshot.queryParamMap.get('fileReference');
    if (fileReference) {
      this.message = `Downloading...`;

      this.leadService.leadExportDownload({ "id": fileReference })
        .pipe(
          finalize(((progressBarSessionIdOnCallback: number) => {
            this.notificationSvc.safelyDisablePageBusy(progressBarSessionIdOnCallback);
          }).bind(this, this.progressBarSessionId)),
          catchError((() => {
            this.message = `Failed to download file`;
            return empty();
          })).bind(this))
        .subscribe((url) => {

          console.log(url["data"]["presignedUrl"]);
          this.notificationSvc.setPageBusy(false);


          let downloadLink = document.createElement('a');
          downloadLink.href = String(url["data"]["presignedUrl"]);
          downloadLink.setAttribute('download', 'filename');
          document.body.appendChild(downloadLink);
          downloadLink.click();

          this.message = 'File has been downloaded';

        }, e => {
          this.notificationSvc.setPageBusy(false);
        });
    }

  }

}
