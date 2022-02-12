import { CampaignProgressTypes } from './../../../dsep-toolset/_interfaces/campaignlist.interface';
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lead-delivery-details-channel',
  templateUrl: './lead-delivery-details-channel.component.html',
  styleUrls: ['./lead-delivery-details-channel.component.scss']
})
export class LeadDeliveryDetailsChannelComponent implements OnInit {
  @Input() title = '';
  @Input() type = 'link';
  @Input() btnText = '';
  @Input() position = 'before';
  @Input() leadOrders = 0;
  @Input() totalOrders = 0;
  @Input() percent = 0;
  @Input() menuData = [];

  numberOfOffPacedSource = 0;

  constructor() { }

  ngOnInit() {
    if (this.menuData.length) {
      this.numberOfOffPacedSource = this.menuData.filter(item => item.type == CampaignProgressTypes.OFF_PACE).length;
    }
  }

  getPopoverTitle(title: string) {
    if (title == 'Telemarketing') {
      return "Telemarketing Sites";
    }
    return title;
  }
}
