import { CommonModule } from "@angular/common";
import { async, ComponentFixture, TestBed } from "@angular/core/testing";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, convertToParamMap } from "@angular/router";
import { MaterialAngularModule } from "../../../material.angular.module";
import { DSEPComponentModule } from "../../../_shared/dsep-components/v0.2/dsep-components.module";
import { DSEPComponentService } from "../../../_shared/dsep-components/v0.2/_common/dsep-global-component";
import { LeadDetailTableComponent } from "./lead-delivery-details-table/lead-delivery-detail-table.component";
import { LeadDetailsComponent } from "./lead-delivery-details.component";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

fdescribe("LeadDetailsComponent", () => {
  let component: LeadDetailsComponent;
  let fixture: ComponentFixture<LeadDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LeadDetailsComponent, LeadDetailTableComponent],
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DSEPComponentModule,
        MaterialAngularModule,
        BrowserAnimationsModule
      ],
      providers: [
        DSEPComponentService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({
                id: "1",
              }),
            },
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LeadDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
