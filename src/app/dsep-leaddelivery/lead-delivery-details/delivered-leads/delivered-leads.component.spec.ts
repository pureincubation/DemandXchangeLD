import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliveredLeadsComponent } from './delivered-leads.component';

describe('DeliveredLeadsComponent', () => {
  let component: DeliveredLeadsComponent;
  let fixture: ComponentFixture<DeliveredLeadsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeliveredLeadsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeliveredLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
