import { Component, Input } from '@angular/core';

@Component({
  selector: 'campaign-progress-allocation',
  templateUrl: './campaign-progress-allocation.component.html',
  styleUrls: ['./campaign-progress-allocation.component.scss']
})
export class CampaignProgressAllocationComponent {
  @Input() numberOfOffPacedSource: number;
  @Input() title: string;
  @Input() data: any;

  getValue(index: number, data: any) {
    return (data[index].leadOrders / data[index].totalOrders * 100).toPrecision(2);
  }

}
