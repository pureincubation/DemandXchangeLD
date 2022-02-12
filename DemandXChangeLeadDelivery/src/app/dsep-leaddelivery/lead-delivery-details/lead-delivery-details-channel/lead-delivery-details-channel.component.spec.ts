import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LeadDeliveryDetailsChannelComponent } from './lead-delivery-details-channel.component';

describe('LeadDeliveryDetailsChannelComponent', () => {
  let component: LeadDeliveryDetailsChannelComponent;
  let fixture: ComponentFixture<LeadDeliveryDetailsChannelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LeadDeliveryDetailsChannelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadDeliveryDetailsChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
