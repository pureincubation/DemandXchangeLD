import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CampaignProgressAllocationComponent } from './campaign-progress-allocation.component';

describe('CampaignProgressAllocationComponent', () => {
  let component: CampaignProgressAllocationComponent;
  let fixture: ComponentFixture<CampaignProgressAllocationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CampaignProgressAllocationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CampaignProgressAllocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
