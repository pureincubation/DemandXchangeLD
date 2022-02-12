

import { BaseColumnComponent } from './../../../../_shared/dsep-components/v0.2/grid/columns/dsep-base-column/dsep-base-column.component';
import {
  Component,
  Input,
  OnInit,
  ViewChild,
  QueryList,
  AfterViewInit,
  ViewChildren,
  Output,
  EventEmitter,
} from "@angular/core";
import { DSEPToastService } from "../../../../_shared/dsep-components/v0.2/notification/dsep-toast/dsep-toast.service";
import { DSEPComponentService } from "../../../../_shared/dsep-components/v0.2/_common/dsep-global-component";
import { DataSourceModel } from "../../../../_shared/dsep-components/v0.2/_model/dsep-datasource.model";
import { DeliveryMethod, DeliveryStatus, LeadDeliveryUserType, LeadStatus, AllLeadsDeliveryStatus, LeadDeliveryStatus, DismissedEnum } from "../../_enums/lead-delivery.enum";
import { UserContext, IWidgets } from "../../_interfaces/lead-delivery.interface";
import { LeadDetailsService } from "../../_services/lead-delivery-details.service";
import { DSEPDataService } from '../../../../_shared/dsep-components/v0.2/_common/dsep-data.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IRequestPagination, LeadDeliveryColumnId, RequestLeadStatus, RequestRepostStatus } from '../../_interfaces/lead-delivery-details.interface';
import { LeadDeliveryService } from '../../_services/lead-delivery.service';
import { filterQueryCriteria } from '../../../../_shared/dsep-components/v0.2/_interfaces/dsep-filter-criteria.interface';
import { AutoPassObjectService } from '../../_services/lead-delivery-autopass.service';
import { Subscription } from 'rxjs-compat';

@Component({
  selector: "lead-detail-table",
  templateUrl: `./lead-delivery-detail-table.component.html`,
  styleUrls: [`./lead-delivery-detail-table.component.scss`]
})
export class LeadDetailTableComponent implements OnInit, AfterViewInit {
  @Input() leadDeliveryDetailsDataSource: DataSourceModel;
  @Input() isDeliveredLeads: boolean;
  @Input() deliveredUsers: [];
  @Input() id: string;
  @Input() isNotYetDeliveredLeads: boolean = false;
  @Input() isDeliverQueue: boolean = false;
  @Input() isDelivered: boolean = false;
  @Input() campaignData: Object = { deliverySchedule: '', deliveryMethod: 0, adminCID: 0, pxCampaignID: '', segmentData: {} };
  @Input() tabStatus;
  @Input() delivereyErrors: [];
  @Input() isDelivereyError: boolean;
  @Input() widgetsPullData: any;
  @Input() isShowProceedButton :boolean = true;

  @Output() onToggleAutoPass = new EventEmitter();

  @ViewChildren(BaseColumnComponent) baseColumnComp: QueryList<BaseColumnComponent>;
  @ViewChild("toolsetGrid") gridRef;
  /**
   * List of all dropdown values all for reference
   */
  dropdownActionValues = [
    { text: 'Select an action', value: 0 },
    { text: 'Qualify', value: 1 },
    { text: 'Dismiss', value: 2 },
    { text: 'Return', value: 3 },
    { text: 'Repost', value: 4 },
    { text: 'Reassign', value: 5 },
    { text: 'Mark as Uploaded', value: 6 },
    { text: 'Remove from Queue', value: 7 },
    { text: 'Add to Queue', value: 8 },
    { text: 'Unreturn', value: 9 },
    { text: 'Undismiss', value: 10}
  ];

  /**
   * List of all dropdown values
   */
  dropdownActionResourceData = [];

  /**
   * isDropdown visible
   */
  isDropdownVisible = false;

  /**
   * isSubmitButtonVisible visible
   */
  isSubmitButtonVisible = false;

  /**
   * isSubmitButtonDisabled
   */
  isSubmitButtonDisabled: boolean = false;

  /**
   * Generic formGroup
   */
  formddpGroupGeneric: FormGroup = new FormGroup({ 'ddp_select_generic': new FormControl({ text: 'Select an action', value: '0' }) });

  additionalDropdownValues = [{ text: 'Select an action', value: '0' },
  { text: 'Mark as uploaded', value: 1 },
  { text: 'Remove from queue', value: 2 }];

  unqualifiedDDOption = [{ text: 'Select an action', value: '0' },
  { text: 'Dismiss', value: 1 },
  { text: 'Qualify', value: 2 }]

  allLeadStatusDDOption = [{text: 'Select an action', value: '0'},
                          {text: 'Return', value: 1}]
  formToggleAutopass: FormGroup = new FormGroup({});
  unqualifiedResonDataSource: DataSourceModel;
  deliveryStatusEnum: any = DeliveryStatus;
  deliveryMethodEnum: any = DeliveryMethod;
  allLeadsStatusEnum: any = AllLeadsDeliveryStatus;
  leadStatus: any = LeadStatus;
  isDeliverDisabled: boolean = true;
  isButtonDisabled: boolean = true;
  showDeliverButton: boolean = false;
  titleTextNoOfLeads: string = '';
  userContex: UserContext;
  isCXMUser: boolean = false;
  notDeliveredInfoWidgets: IWidgets[] = [];
  notDeliveredInfoWidgetsMulti: IWidgets[] = [];
  batchCollection: any[] = [];
  countLeads: number;
  formddpGroup: FormGroup = new FormGroup({ 'ddp_select': new FormControl(this.additionalDropdownValues[0]) });
  formUnqualification: FormGroup = new FormGroup({});
  leadDeliveryColumnDef = LeadDeliveryColumnId;
  returnReasonsList: Object[] = [];
  deliveryMethod: DeliveryMethod;
  autopassSwitchToolTip: string = '';
  autopassSwitchHeader: string = '';
  autopassSwitchState: boolean = false;
  //Buttons
  showAddToQueueButton: boolean = false;
  showRemoveButton: boolean = false;
  showNotifyCXMButton: boolean = false;
  showSubmitButton: Boolean = false;
  showExport3pUploadButton: Boolean = false;
  showDropDownAction: boolean = false;
  showReturnCtaButton: boolean = false;
  showQualifyButton: boolean = false;
  showQualifyDropDownAction: boolean = false;
  showUnQualifyButton: boolean = false;
  showUnQualifyDropDownAction: boolean = false;

  isSubmitDisabled: boolean = false;
  isRemoveDisabled: boolean = false;
  isReQualifyDisabled: boolean = false;
  isUnQualifyDisabled: boolean = false;

  quickSearchName: string = '';
  dynamicColumnList: BaseColumnComponent[] = [];
  dynamicColumnMetaData: Object = {};


  //DataSelected
  selectedAddToQueue: any[] = [];
  selectedDeliverQueList: any[] = [];
  selectedDeliveredList: any[] = [];
  seleectedAllTabLeads: any[] = [];
  selectedUnqualifiedLeadsList: any[] = [];
  selectedErrorsForRepost: any[] = [];

  leadUserType: number;
  totalCount: number = 0;

  dismissedEnum = DismissedEnum;
  monthlyPacing: string = "";
  formReassign: FormGroup = new FormGroup({});
  segmentParams = {};
  ldPXSegmentListDataSource: DataSourceModel;
  pxSegements = [];
  selectedSegement: any;
  isReplacementNeeded: boolean = false;
  reasons: string = '';
  isClientReturn: boolean;
  needReplacementList:any = [{ value: true, text: "Needs Replacement" }, { value: false, text: "No Replacement" }];
  failedLeadIds = [];
  finalizedLeads = [];

  hasAgingUndelivered: boolean = false;
  autopassStateSubscription: Subscription;
  
  bulkSearchColList = [];
  formBulkSearch: FormGroup = new FormGroup({});
  isValidBulkSearch: boolean = false;
  
  constructor(private _dsepService: DSEPComponentService,
    private _toasSvc: DSEPToastService,
    private leadDeliveryDetailsService: LeadDetailsService,
    private leadDeliveryService: LeadDeliveryService,
    private dataService: DSEPDataService,
    private autopassSvc: AutoPassObjectService
  ) { }

  ngOnInit() {
    this.autopassSvc.currentAutoPassStateValue.subscribe((a => {
       this.autopassSwitchState = a;
       this.autopassSwitchHeader = this.autopassSvc.getCurrentConfirmMessage();
       this.autopassSwitchToolTip = this.autopassSvc.getCurrentToolTipMessage();
    }).bind(this));

    this.deliveryMethod = this.campaignData["segmentData"]["deliveryMethod"];
    this.formToggleAutopass.addControl("autopassonoff", new FormControl(this.autopassSwitchState));
    this.notDeliveredInfoWidgets = [
      { text: this.campaignData["segmentData"]["deliveryFrequencies"].join(','), title: 'Delivery Schedule', color: '#283593', showHelpIcon: true, tooltipText: "Tooltip Text" },
      { text: DeliveryMethod[this.deliveryMethod], title: 'Delivery Method', color: '#283593', showHelpIcon: true, tooltipText: "Tooltip Text" }
    ]
   
    if(this.tabStatus === 16){
      this.formddpGroup.addControl("ddp_selectQualify", new FormControl(this.unqualifiedDDOption[0]));
    }
    if(this.tabStatus === 0 || this.tabStatus === 4 || this.tabStatus === 1){
      this.formddpGroup.addControl("ddp_selectUnqualify", new FormControl(this.unqualifiedDDOption[0]));
      this.formUnqualification.addControl("ddp_returnReasons", new FormControl(null, [Validators.required]));
      this.formUnqualification.addControl("needReplacement", new FormControl(null, [Validators.required]));
      this.formUnqualification.addControl("clientRejected", new FormControl(false));
      this.leadDeliveryDetailsService.getListOfUnqualifyingReasons().subscribe(objDataRes => {
        this.returnReasonsList = objDataRes.data.items.map(obj => {
          return {
            text: obj["reason"],
            value: obj["id"]
          }
        });
      });
    }

    if (this.tabStatus === 1 || this.tabStatus === 0 || this.tabStatus === 4) {
      this.getPxSegements();
    }

    this.loadWidgetsDeliveryCounts();

    this.unqualifiedResonDataSource = new DataSourceModel();
    this.unqualifiedResonDataSource.data = [];
    this.unqualifiedResonDataSource.loadData();
    this.unqualifiedResonDataSource.isAutoLoad = true;

    this.getBulkSearchColumns();
    this.initBulkSearch();
  }
  toggleAutopass(data, autopassconfirmdialog){
     this.autopassSwitchState = data.checked;
     autopassconfirmdialog.openDialog();
  }
  confirmAutopassAction(dialog, answer){
    if(!answer){
      this.autopassSwitchState = this.autopassSvc.getCurrentValue();
      dialog.closeDialog();
      return;
    }else{
      let param: any = { admincampaignid: this.campaignData["adminCID"], 
                           pxsegmentid:this.campaignData["segmentData"]["pxSegmentID"], 
                           autopassenabled: this.autopassSwitchState, 
                           updatedby: this.leadDeliveryService.loggedInUser().id };
      this.leadDeliveryDetailsService.toggleSubmitAutoPassState(param).subscribe(a => {
          if(a && a["data"]){
            let msg = "Autopass successfully disabled";
            this.onToggleAutoPass.emit(this.autopassSwitchState);
            if(this.autopassSwitchState){
              msg = "Autopass successfully enabled";
            }
            this._toasSvc.openSuccessfulMessage(msg);
            dialog.closeDialog();
          }
      });
    }
  }

  ngAfterViewInit() {
    this.leadDeliveryDetailsDataSource.visibleColumns = this.baseColumnComp.map(component => LeadDeliveryColumnId[component.refName]).filter(Boolean);
    //this.leadDeliveryDetailsDataSource.visibleColumns.push(27); //added uq details (27) id as all tab should have export visible column uq details
  }

  refreshGridLeadDelivery() {
    this._dsepService.getComponent(this.id).refresh();
  }

  showAgingUndelivered(){
    this.leadDeliveryDetailsDataSource.params["IsAgingUndelivered"] = true;
    this.leadDeliveryDetailsDataSource.loadData();
    this.hasAgingUndelivered = false;
  }

  showAllLeads(){
    this.leadDeliveryDetailsDataSource.params["IsAgingUndelivered"] = false;
    this.leadDeliveryDetailsDataSource.loadData();
    this.hasAgingUndelivered = true;
  }

  loadWidgetsDeliveryCounts(){
    if(this.isNotYetDeliveredLeads){
      //if(this.widgetsPullData.agingUndelivered > 0){
         this.hasAgingUndelivered = true;
      //}

      this.notDeliveredInfoWidgetsMulti = [
      { count: this.widgetsPullData.agingUndelivered, title: 'Aging Undelivered', color: '#4CAF50', showHelpIcon: false, tooltipText: "Aging Undelivered" },
      { count: this.widgetsPullData.leadsNotYetDelivered, title: 'New Qualified leads', color: '#4CAF50', showHelpIcon: true, tooltipText: "New Qualified leads" },
      { count: this.monthlyPacing, title: 'Monthly Pacing', color: '#40C4FF', showHelpIcon: true, tooltipText: "Monthly Pacing" }]
      this.quickSearchName = "isNotYetDeliveredLeads"
    }

    if (this.isDeliverQueue) {
      this.notDeliveredInfoWidgetsMulti = [{ count: this.widgetsPullData.leadsToDeliver, title: 'Leads for Delivery', color: '#4CAF50', showHelpIcon: true, tooltipText: "Leads for Delivery" },
      { count: this.monthlyPacing, title: 'Monthly Pacing', color: '#40C4FF', showHelpIcon: true, tooltipText: "Monthly Pacing" }]
      this.quickSearchName = "isDeliverQueue"
    }

    if (this.isDelivered) {
      this.notDeliveredInfoWidgetsMulti = [{ count: this.widgetsPullData.leadsDelivered, title: 'Total Leads Delivered', color: '#4CAF50', showHelpIcon: true, tooltipText: "Total Leads Delivered" },
      { count: this.widgetsPullData.leadsReturned, title: 'Returned Leads', color: '#40C4FF', showHelpIcon: true, tooltipText: "Returned Leads" }]
      this.quickSearchName = "isDelivered"
    }

    if (this.isDelivereyError) {
      this.quickSearchName = "isDelivereyError"
    }

    if (this.leadDeliveryDetailsDataSource) {
      this.leadDeliveryDetailsDataSource.onSuccessCompleteResponse.subscribe((data: any) => {
        this.totalCount = data.totalCount;
      })
    }
    if (this.tabStatus === 1 || this.tabStatus === 2) {
      this.getMonthlyPacing();
    }
  }

  onSearchEmitter(eventValue){
      if (eventValue) {
        this.leadDeliveryDetailsDataSource.service = this.leadDeliveryDetailsService;
        this.leadDeliveryDetailsDataSource.quickSearchValue = eventValue;
        this.leadDeliveryDetailsDataSource.quickSearchMethod = 'filterTable';
        if(this.tabStatus === 16){
          this.leadDeliveryDetailsDataSource.filterCriteriaInstance.push(this.leadDeliveryDetailsDataSource.params["filterCriteria"][0]);
        }

        this.leadDeliveryDetailsDataSource.doSearch();       
      } else {
        this._dsepService.getComponent(this.id).refresh();
      }
  }
  onExpandShow(event: any) {
    if (this._dsepService.getComponent("leadUqReasons")) {
      this._dsepService.getComponent("leadUqReasons").refresh();
    }
    if (event.data.currentColumnSelected) {
      this.unqualifiedResonDataSource.data = event.data.currentColumnSelected.unqualifiedDetails.uqReasons;
      this.unqualifiedResonDataSource.loadData();
    }
  }

  setNumberOfLeadsMessage(leadsCount: number) {
    this.titleTextNoOfLeads = ``;
    if (leadsCount > 0) {
      this.titleTextNoOfLeads = `${leadsCount} Leads Selected`;
    }
    this.countLeads = leadsCount;
  }

  checkLeadChange(selection: any) {
    let cntSelected = selection["source"]["selected"];
    if (this.isNotYetDeliveredLeads) {
      this.selectedAddToQueue = cntSelected;
    }
    if (this.isDeliverQueue) {
      this.selectedDeliverQueList = cntSelected;
    }
    if (this.tabStatus === 4) {
      this.selectedDeliveredList = cntSelected;
      let paramsEvent = { value: this.formddpGroupGeneric.get('ddp_select_generic').value };
      this.onDropdownChange(paramsEvent);
    }

    if (this.tabStatus === 0) {
      this.seleectedAllTabLeads = cntSelected;
      let paramsEvent = { value: this.formddpGroupGeneric.get('ddp_select_generic').value };
      this.onDropdownChange(paramsEvent);
    }

    if (this.tabStatus === 8) {
      this.selectedErrorsForRepost = cntSelected;
    }

    if (this.tabStatus === 16) {
      this.selectedUnqualifiedLeadsList = cntSelected;
      let paramsEvent = {value: this.formddpGroupGeneric.get('ddp_select_generic').value };
      this.onDropdownChange(paramsEvent);
   }

    this.setNumberOfLeadsMessage(cntSelected.length);
    if (cntSelected.length > 0) {
      this.isShowDropdownAction();
    } else {
      this.formddpGroupGeneric.get('ddp_select_generic').setValue(this.dropdownActionResourceData[0]);
      this.showRemoveButton = false;
      this.showAddToQueueButton = false;
      this.isSubmitButtonVisible = false;
      this.isDropdownVisible = false;
    }
  }

  onLeadDeliveryExport() {
    if (this.leadDeliveryDetailsDataSource.data.length > 0) {
      this.leadDeliveryDetailsDataSource.doExport();
    } else {
      this._toasSvc.openErrorMessage('No data to export');
    }
  }

  isShowRemoveButton() {
    if (this.tabStatus === 2 && (this.deliveryMethod === DeliveryMethod['Manual via Email'] || this.deliveryMethod === DeliveryMethod['Manual Upload to 3P'])) {
      this.showRemoveButton = true;
    }
  }

  onDropdownChange($event) {

    this.isSubmitButtonVisible = true;
    this.isSubmitButtonDisabled = true;
    if (Number($event.value) === 0) {
      this.isSubmitButtonVisible = false;
      this.isSubmitButtonDisabled = true;
      this.showRemoveButton = false;
    }
    if (Number($event.value) === 1) {
      this.isSubmitButtonDisabled = false;
      if (this.tabStatus === 0) {
        let isForQualify = this.seleectedAllTabLeads.find(a => a.status.value !== 3);
        if (isForQualify) {
          this.isSubmitButtonDisabled = true;
        }
      }
      if (this.tabStatus === 16) {
        let isForQualify = this.selectedUnqualifiedLeadsList.find(a => a.status.value !== 3);
        if (isForQualify) {
          this.isSubmitButtonDisabled = true;
        }
      }
    }
    

    if (Number($event.value) === 10) {
      this.isSubmitButtonDisabled = false;
      if(this.tabStatus === 0){
        let isForUndismissed = this.seleectedAllTabLeads.find(a => a.status.value !== 3 || (a.status.value === 3 && a.dismissed.value === 0));
        if(isForUndismissed){
          this.isSubmitButtonDisabled = true;
        }
      }
      if(this.tabStatus === 16){
        let isForUndismissed = this.selectedUnqualifiedLeadsList.find(a => a.status.value === 3 && a.dismissed.value === 0);
        if(isForUndismissed){
          this.isSubmitButtonDisabled = true;
        }
      }

    }


    if (Number($event.value) === 2) {
      this.isSubmitButtonDisabled = false;
      if(this.tabStatus === 0){
        let isForDismissed = this.seleectedAllTabLeads.find(a => a.status.value === 3 && a.dismissed.value === 1);
        if(isForDismissed){
          this.isSubmitButtonDisabled = true;
        }
      }
      if(this.tabStatus === 16){
        let isForDismissed = this.selectedUnqualifiedLeadsList.find(a => a.status.value === 3 && a.dismissed.value === 1);
        if(isForDismissed){
          this.isSubmitButtonDisabled = true;
        }
      }

    }
    if (Number($event.value) === 3) {
      this.isSubmitButtonDisabled = false;
      if (this.tabStatus === 0) {
        let isForReturn = this.seleectedAllTabLeads.find(a => a.status.value !== 1);
        let isClientReturn = this.seleectedAllTabLeads.filter(a => a.deliveryStatus.value === 4).length === this.seleectedAllTabLeads.length;
        let isInternalReturn = this.seleectedAllTabLeads.filter(a => a.deliveryStatus.value === 1).length === this.seleectedAllTabLeads.length;
        this.isClientReturn = isClientReturn;
        if(isForReturn || !(isClientReturn || isInternalReturn)){
          this.isSubmitButtonDisabled = true;
        }

      }
      if(this.tabStatus === 1){
        let isForReturn = this.selectedAddToQueue.find(a => a.status.value !== 1);
        if(isForReturn){
          this.isSubmitButtonDisabled = true;
        }
        this.isClientReturn = false;
      }
      if (this.tabStatus === 4) {
        let isForReturn = this.selectedDeliveredList.find(a => a.status.value !== 1);
        if (isForReturn) {
          this.isSubmitButtonDisabled = true;
        }
        this.isClientReturn = true;
      }
    }
    if (Number($event.value) === 4) {
      this.isSubmitButtonDisabled = false;
      if(this.tabStatus === 0){
        let isForRepost = this.seleectedAllTabLeads.find(a => a.status.value !== 1 || (a.deliveryStatus.value !== 8 && a.deliveryStatus.value !== 4 && a.deliveryStatus.value !== 1));
        if(isForRepost){
          this.isSubmitButtonDisabled = true;
        }
      }
    }
    if (Number($event.value) === 5) {
      this.isSubmitButtonDisabled = false;
      if (this.tabStatus === 0) {
        let isForReassign = this.seleectedAllTabLeads.find(a => a.status.value !== 1);
        if (isForReassign) {
          this.isSubmitButtonDisabled = true;
        }
      }
    }
    if (Number($event.value) === 6) {
      this.isSubmitButtonDisabled = false;
      this.showRemoveButton = false;
    }
    if (Number($event.value) === 7) {
      this.isSubmitButtonVisible = false;
      this.isShowRemoveButton();
    }
    if (Number($event.value) === 8) {
      this.isSubmitButtonDisabled = false;
    }

    if (Number($event.value) === 9) {
      this.isSubmitButtonDisabled = false;
      if (this.tabStatus === 0) {
        let isForUnreturn = this.seleectedAllTabLeads.find(a => a.status.value === 1 || (a.deliveryStatus.value !== 8 && a.deliveryStatus.value !== 4));
        if (isForUnreturn) {
          this.isSubmitButtonDisabled = true;
        }
      }
      if (this.tabStatus === 4) {
        let isForUnreturn = this.selectedDeliveredList.find(a => a.status.value === 1);
        if (isForUnreturn) {
          this.isSubmitButtonDisabled = true;
        }
      }
    }
  }

  isShowDropdownAction() {

    if(this.tabStatus === 1){
      if(this.deliveryMethod === DeliveryMethod.Autopass || this.deliveryMethod === DeliveryMethod['Autopass and Manual']){
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 4);
      }else{
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 3 || d.value === 5 || d.value === 8).reverse();
      }
      
    }

    if (this.tabStatus === 2) {
      if (this.deliveryMethod === DeliveryMethod['Manual Upload to 3P']) {
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 6 || d.value === 7);
      }
      if (this.deliveryMethod === DeliveryMethod['Manual via Email']) {
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 7);
      }

    }

    if (this.tabStatus === 4) {
      this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 3 || d.value === 5 || d.value === 9);
      if (this.deliveryMethod === DeliveryMethod.Autopass || this.deliveryMethod === DeliveryMethod['Autopass and Manual']) {
        this.dropdownActionResourceData.push(this.dropdownActionValues.find(d => d.value === 4));
      }
    }

    if (this.tabStatus === 8) {
      this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 4);
    }

    if(this.tabStatus === 16){
      this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value === 1 || d.value === 2 || d.value  === 10);
    }

    if (this.tabStatus === 0) {
      if (this.deliveryMethod === DeliveryMethod.Autopass || this.deliveryMethod === DeliveryMethod['Autopass and Manual']) {
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value !== 6 && d.value !== 8 && d.value !== 0 && d.value !== 7);
      } else {
        this.dropdownActionResourceData = this.dropdownActionValues.filter(d => d.value !== 4 && d.value !== 6 && d.value !== 8 && d.value !== 0 && d.value !== 7);
      }
    }

    this.dropdownActionResourceData.splice(0, 0, this.dropdownActionValues.find(d => d.value === 0));
    this.isDropdownVisible = true;

  }

  onSubmitGeneric(dialog?: any, dialogReassign?: any,dialogReturn?: any) {

    let selectedDDV = this.formddpGroupGeneric.get('ddp_select_generic').value
    switch (selectedDDV) {
      case 0: {
        break;
      }

      case 1: {
        this.onSubmitQualify();
        break;
      }

      case 2: {
        this.onSubmitDismissed();
        break;
      }

      case 3: {
        this.onSubmitUnQualify(dialog);
        break;
      }

      case 4: {
        this.onSubmitRepost();
        break;
      }

      case 5: {
        let submitReassignedLeads = [];
        if (this.tabStatus === 1) {
          submitReassignedLeads = this.selectedAddToQueue.map(l => {
            return l["leadId"];
          });
        }
        if (this.tabStatus === 0) {
          submitReassignedLeads = this.seleectedAllTabLeads.map(l => {
            return l["leadId"];
          });
        }
        if (this.tabStatus === 4) {
          submitReassignedLeads = this.selectedDeliveredList.map(l => {
            return l["leadId"];
          });
        }
        let params = {
          leadid: submitReassignedLeads
        }
        this.leadDeliveryDetailsService.isValidForReaasign(params).subscribe(res => {
          if ((res && res.data) && res.data["success"]) {
            this.onSubmitReassigned(dialogReassign);
          } else {
            this._toasSvc.openErrorMessage("Selected leads not valid for Reassign");
          }
        });
        break;
      }
      case 6: {
        this.onSubmitFromQueue();
        break;
      }

      case 8: {
        this.onAddToQueueCliecked();
        break;
      }
      case 9: {  this.onSubmitUnreturn();
        break;
      
      }
      case 10: {
        this.onSubmitUndismissed();
        break;
      }
    }
  }

  onAddToQueueCliecked() {
    let notYetDevGrid = this._dsepService.getComponent(this.id);
    let param: RequestLeadStatus = {
      status: 2, leadId: [], adminCampaignId: this.campaignData["adminCID"], pxSegmentId: this.campaignData["segmentData"]["pxSegmentID"]
    } as RequestLeadStatus;

          param.leadId =this.selectedAddToQueue.map(l => {
            return l["leadId"];
          })
      this.leadDeliveryDetailsService.addLeadsToDeliveryQueue(param).subscribe(a => {
          if(a > 0){
            this._toasSvc.openSuccessfulMessage(`Selected leads have been added to the Delivery Queue.`);
            this.updateLDWidgetsStatus();
            //notYetDevGrid.refresh();
            //let deliveryQueue = this._dsepService.getComponent("leadDeliveryQueue");
            //deliveryQueue.refresh();
            this.onAfterSubmitReloadGrid();
          }
      });
  }

  onRemoveFromQueue(){
      //let notYetDevGrid = this._dsepService.getComponent(this.id);
      let param: RequestLeadStatus = {
         status: 1, leadId: [], adminCampaignId: this.campaignData["adminCID"]  , pxSegmentId: this.campaignData["segmentData"]["pxSegmentID"]
      } as RequestLeadStatus;

      param.leadId =this.selectedDeliverQueList.map(l => {
        return l["leadId"];
     })

      this.leadDeliveryDetailsService.removeLeadsFromDeliveryQueue(param).subscribe(a => {
          if(a > 0){
            this._toasSvc.openSuccessfulMessage(`Selected leads have been remove to the Delivery Queue.`);
            this.updateLDWidgetsStatus();
            //notYetDevGrid.refresh();
            //let deliveryQueue = this._dsepService.getComponent("leadDeliveryNotDelivered");
            //deliveryQueue.refresh();
            this.onAfterSubmitReloadGrid();
          }
      });
  }

   
 
  onSubmitRepost() {
    let param: RequestRepostStatus = {
      leadIds: [], campaignId: this.campaignData["adminCID"]
    } as RequestRepostStatus;

    if (this.tabStatus === 0) {
      param.leadIds = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 4) {
      param.leadIds = this.selectedDeliveredList.map(l => {
        return l["leadId"];
      });
    }
    if (this.tabStatus === 8) {
      param.leadIds = this.selectedErrorsForRepost.map(l => {
        return l["leadId"];
      });
    }


    this.leadDeliveryDetailsService.submitLeadsRepost(param).subscribe(a => {
        if(a){
          this._toasSvc.openSuccessfulMessage(`Selected leads have been reposted for autopass.`);
          this.updateLDWidgetsStatus();
          //this._dsepService.getComponent(this.id).refresh();
          this.onAfterSubmitReloadGrid();
        }
    });
  }

  onSubmitUndismissed(){
      let submitDismissedLeads = [];
      if(this.tabStatus === 0){
          submitDismissedLeads=this.seleectedAllTabLeads.map(l => {
          return l["leadId"];
        });
      }

      if(this.tabStatus === 16){
        submitDismissedLeads=this.selectedUnqualifiedLeadsList.map(l => {
          return l["leadId"];
        });
      }

      this.leadDeliveryDetailsService.submitLeadsAsDismissed({ LeadId: submitDismissedLeads, Dismiss: false }).subscribe(obj => {
          if (obj) {
              this._toasSvc.openSuccessfulMessage(`Successfully undismissed leads`);
              this.updateLDWidgetsStatus();
              //this._dsepService.getComponent("leadDeliveryUnqualified").refresh();
              //this._dsepService.getComponent("leadDeliveryAll").refresh();
              //this._dsepService.getComponent(this.id).refresh();
              this.onAfterSubmitReloadGrid();
          } else {
              this._toasSvc.openErrorMessage("Failed to undismiss leads");
          }
      })
  }

  onAfterSubmitReloadGrid(){
    let currentGrid =  this._dsepService.getComponent(this.id);
          
    if(currentGrid.dataSource["filterCriteriaInstance"].length > 0){
      currentGrid.dataSource["filterObjectCriteria"] = currentGrid.dataSource["filterCriteriaInstance"]
      currentGrid.dataSource["onFilterLoadData"]();
      currentGrid.dsepCheckboxResetService.reset.next(true);
    }else{
      currentGrid.refresh();
    }
  }
  
  onSubmitDismissed(){
    let submitDismissedLeads = [];
    if (this.tabStatus === 0) {
      submitDismissedLeads = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 16) {
      submitDismissedLeads = this.selectedUnqualifiedLeadsList.map(l => {
        return l["leadId"];
      });
    }

    this.leadDeliveryDetailsService.submitLeadsAsDismissed({ leadId: submitDismissedLeads }).subscribe(obj => {
      if (obj) {
        this._toasSvc.openSuccessfulMessage(`Successfully Dismissed leads`);
        this._dsepService.getComponent("leadDeliveryNotDelivered").refresh();
        this._dsepService.getComponent("leadDeliveryAll").refresh();
        this._dsepService.getComponent(this.id).refresh();

      } else {
        this._toasSvc.openErrorMessage("Submit Dismiss leads failed");
      }
    })
  }
  onSubmitUnreturn() {
    let submitUnreturnLeads = [];
    if (this.tabStatus === 0) {
      submitUnreturnLeads = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 4) {
      submitUnreturnLeads = this.selectedDeliveredList.map(l => {
        return l["leadId"];
      });
    }
    this.leadDeliveryDetailsService.submitUnreturnLeads({ leadsId: submitUnreturnLeads, adminCampaignId: this.campaignData["adminCID"] }).subscribe(objRes => {
      if (objRes) {
        if (objRes["success"]) {
          this._toasSvc.openSuccessfulMessage(this.countLeads + ` ` + `Leads` + ` ` + `Successfully Unreturned`);
          // this._dsepService.getComponent(this.id).refresh();
          this.onAfterSubmitReloadGrid();
        } else {
          this._toasSvc.openErrorMessage("Cannot unreturn leads from the finalized month");
        }
      }
    })
  }


 
  onSubmitReassigned(dialog: any) {
    dialog.openDialog();
  }

  onSubmitReassigned1(dialog: any, dialog1: any) {
    if (this.formReassign.valid) {
      dialog.openDialog();
      dialog1.closeDialog();
    }
  }

  closeReassignDialog(dialog: any) {
    dialog.closeDialog();
    this.formReassign.reset();
  }

  submitReassigned(dialog: any) {
    let submitReassignedLeads = [];

    if (this.tabStatus === 1) {
      submitReassignedLeads = this.selectedAddToQueue.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 0) {
      submitReassignedLeads = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 4) {
      submitReassignedLeads = this.selectedDeliveredList.map(l => {
        return l["leadId"];
      });
    }

    let submitReassignParams = {
      leadid: submitReassignedLeads,
      currentcampaignid: this.campaignData["adminCID"],
      selectedcampaignid: this.selectedSegement.adminCampaignID,
      selectedpxsegmentid: this.selectedSegement.value.text,
      updatedby: this.leadDeliveryService.loggedInUser().id
    }

    this.leadDeliveryDetailsService.reassignLeads(submitReassignParams).subscribe(objRes => {
      if((objRes && objRes.data) && objRes.data["success"]){
        this.updateLDWidgetsStatus();
        let leadsCountMsg = this.countLeads+" lead"+(this.countLeads > 1 ? "s":"");
          this._toasSvc.openSuccessfulMessage(`${leadsCountMsg} reassigned from  ${this.campaignData["segmentData"]["pxSegmentID"]} - ${this.campaignData["segmentData"]["segmentName"]} to ${this.selectedSegement["pxSegmentID"]["text"]} - ${this.selectedSegement["segmentName"]}.`);

        //this._dsepService.getComponent(this.id).refresh();
        this.onAfterSubmitReloadGrid();
        dialog.closeDialog();
        this.formReassign.reset();
      } else {
        this._toasSvc.openErrorMessage("Submit reassign leads failed");
      }
    });
  }

  onSubmitFromQueue(){
   // let notYetDevGrid = this._dsepService.getComponent(this.id);
    let param: RequestLeadStatus = {
      status: 4, leadId: [], adminCampaignId: this.campaignData["adminCID"], pxSegmentId: this.campaignData["segmentData"]["pxSegmentID"]
    } as RequestLeadStatus;

    param.leadId = this.selectedDeliverQueList.map(l => {
      return l["leadId"];
    })
    this.leadDeliveryDetailsService.submitLeadsAsDelivered(param).subscribe(a => {
        if(a > 0){
          this._toasSvc.openSuccessfulMessage(`Selected leads have been delivered.`);
          this.updateLDWidgetsStatus();
         //notYetDevGrid.refresh();
          //let deliveredTable = this._dsepService.getComponent("leadDeliveryDelivered");
          //deliveredTable.refresh();
          this.onAfterSubmitReloadGrid();
        }
    });
  }

  onSubmitQualify() {


    let submitQualifyingLeads = [];
    if (this.tabStatus === 0) {
      submitQualifyingLeads = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 16) {
      submitQualifyingLeads = this.selectedUnqualifiedLeadsList.map(l => {
        return l["leadId"];
      });
    }

      this.leadDeliveryDetailsService.submitQualifyingLeads({lead: submitQualifyingLeads}).subscribe(obj =>{
        if(obj){
          this._toasSvc.openSuccessfulMessage(`Successfully submitted for qualifying leads`);
          this.updateLDWidgetsStatus();
         // this._dsepService.getComponent("leadDeliveryNotDelivered").refresh();
          //this._dsepService.getComponent("leadDeliveryAll").refresh();
          //this._dsepService.getComponent(this.id).refresh();
          this.onAfterSubmitReloadGrid();
        }else{
          this._toasSvc.openErrorMessage("Submit qualifying leads failed");
        }
      })
  }

  submitUnqualified(dialog: any, dialogReturnConfirm: any){
    if(this.formUnqualification.invalid) {
      this.formUnqualification.get('ddp_returnReasons').markAsTouched();
      return false;
    }

    let ddActionNeedReplacement= this.formUnqualification.get('needReplacement').value?true:false;
    let selectedReasonsList = this.returnReasonsList.filter(a => this.formUnqualification.value.ddp_returnReasons.includes(a['value']));
    this.reasons = '';
    selectedReasonsList.forEach((a, i) => {
      if(i < (selectedReasonsList.length - 1)) {
        this.reasons = this.reasons + a['text'] + ', ';
      } else {
        this.reasons = this.reasons + a['text'] + '.';
      }
    })
    if(!this.isClientReturn) {
      this.checkIfValidForInternalReturn(dialogReturnConfirm);
    } else {
      this.dialogReturnConfirm(dialogReturnConfirm);
    }
    dialog.closeDialog();
    this.isReplacementNeeded = ddActionNeedReplacement;
  }

  checkIfValidForInternalReturn(dialogReturnConfirm) {
    let submitReturnLeads = [];
    if(this.tabStatus === 1){
      submitReturnLeads = this.selectedAddToQueue.map(l => {
        return l["leadId"];
      });
    }
    if(this.tabStatus === 0){
      submitReturnLeads = this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }
    let params = {
      leadid: submitReturnLeads
    }
    this.leadDeliveryDetailsService.isValidForInternalReturn(params).subscribe(res => {
      if((res && res.data) && !res.data["success"]) {
        this.failedLeadIds = res.data["failedLeadIds"];
        if(this.tabStatus === 1){
          this.finalizedLeads = this.selectedAddToQueue.filter(a => this.failedLeadIds.includes(a['leadId']));
        }
        if(this.tabStatus === 0){
          this.finalizedLeads = this.seleectedAllTabLeads.filter(a => this.failedLeadIds.includes(a['leadId']));
        }

        if(this.finalizedLeads.length > 0){
          this.isShowProceedButton=false;

        }else{
          this.isShowProceedButton=true;
        }
      }
    
      this.dialogReturnConfirm(dialogReturnConfirm);
    }); 
  }
  

  dialogReturnConfirm(dialog) {
    dialog.openDialog();
  }

  confirmReturnDialog(dialog) {
    let ddActionReturnReason: any[] = this.formUnqualification.get('ddp_returnReasons').value;
    let ddActionNeedReplacement= this.formUnqualification.get('needReplacement').value?true:false;

    let submitLeadsQualifiedParams = { PXSegmentId: this.campaignData["segmentData"]["pxSegmentID"], LeadIds:[],
        adminCampaignId: this.campaignData["adminCID"] ,IsNeedReplacement: ddActionNeedReplacement, 
       IsClientRejected: this.isClientReturn, leadReturnReasonId: ddActionReturnReason};

    if(this.tabStatus === 1){
      submitLeadsQualifiedParams.LeadIds =this.selectedAddToQueue.map(l => {
        return l["leadId"];
      });
    }
    
    if(this.tabStatus === 0){
      submitLeadsQualifiedParams.LeadIds =this.seleectedAllTabLeads.map(l => {
        return l["leadId"];
      });
    }

    if (this.tabStatus === 4) {
      submitLeadsQualifiedParams.LeadIds = this.selectedDeliveredList.map(l => {
        return l["leadId"];
      });
    }

    this.leadDeliveryDetailsService.submitUnqualifyingLeads(submitLeadsQualifiedParams).subscribe(objRes => {
      if ((objRes && objRes.data) && objRes.data["success"]) {
        this._toasSvc.openSuccessfulMessage(`Successfully submitted return leads`);
        this.updateLDWidgetsStatus();
        //this._dsepService.getComponent(this.id).refresh();
        this.onAfterSubmitReloadGrid();
        dialog.closeDialog();
        
      }else{
        this._toasSvc.openErrorMessage("Submit return leads failed");
      }
    });
  }

  closeReturnDialog(dialog: any) {
    this.finalizedLeads=[]; 
    this.isShowProceedButton=true; 
    dialog.closeDialog();

  }

  onSubmitUnQualify(dialog: any){
    
    this.formUnqualification.reset();
    dialog.openDialog();
  }

  closeManualQualiDialog(dialog: any) {
    this._dsepService.getComponent(this.id).refresh();
    this.formUnqualification.reset();
    dialog.closeDialog();
  }

  getMonthlyPacing() {
    this.leadDeliveryDetailsService.getMonthlyPacing({AdminCampaignId:this.campaignData['adminCID']}).subscribe(res => {
      if(res && res.data) {
        this.monthlyPacing = res.data.monthlyPacing;
        if(this.isNotYetDeliveredLeads){
          this.notDeliveredInfoWidgetsMulti[2].count = this.monthlyPacing;
        }
        if(this.isDeliverQueue){
          this.notDeliveredInfoWidgetsMulti[1].count = this.monthlyPacing;
        }
      }
    })
  }

  getPxSegements() {
    this.segmentParams =  { pxCampaignID: this.campaignData['segmentData'].pxCampaignID, pagination: { includeTotal: true } as IRequestPagination, filterCriteria: [{fieldCode: 1002, type: "Boolean", value: "true"} as filterQueryCriteria] };
    this.ldPXSegmentListDataSource = new DataSourceModel(this.leadDeliveryService);
    this.ldPXSegmentListDataSource.params = this.segmentParams;
    this.ldPXSegmentListDataSource.isProxy = true;
    this.ldPXSegmentListDataSource.method = "getSegmentDataByCampID";
    this.ldPXSegmentListDataSource.isAutoLoad = false;

    this.leadDeliveryService.getSegmentDataByCampID(this.segmentParams).subscribe(res => {
      this.pxSegements = res['data'];
      this.pxSegements = this.pxSegements.filter(obj => obj.pxSegmentID.text !== this.campaignData['segmentData']['pxSegmentID'])
      this.pxSegements = this.pxSegements.map(obj => {
        return {
          text: obj.pxSegmentID.text + ' - ' + obj.segmentName,
          value: obj.pxSegmentID,
          ...obj
        }
      });
    })
  }

  onPxSegementListChange(event) {
    if (event && event.value) {
      let selectedValue = event.value.text;
      this.selectedSegement = this.pxSegements.filter(a => a.value.text === selectedValue)[0];
    }
  }

  rightClickCopyValue(event: any){
      let test = this;
  }
  autopassLogHolderContent: any = '';
  onClickViewLogs(data: any, dialog){
      this.autopassLogHolderContent = {request: data["autopassRequestLog"], response: data["autopassResponseLog"]};
      dialog.openDialog();
  }
  closeAutopassLogDialog(dialog){
     dialog.closeDialog();
  }

  onBulkSearch(dialog: any){
    dialog.openDialog();
  }

  getBulkSearchColumns(){
    this.bulkSearchColList = Object.keys(this.leadDeliveryColumnDef).map((i) =>{
      //let item = this.leadDeliveryColumnDef[i];
      return {
        text: i,
        value: this.leadDeliveryColumnDef[i] 
      };
    });    
  }

  onFieldListChange(event){
    if(event && event.value) {   
      //this.selectedBulkSearchField = event.value;      
    }
  }

  initBulkSearch(){
    this.formBulkSearch.addControl("bulkSearchFieldText", new FormControl());
    this.formBulkSearch.addControl("bulkSearchFieldList", new FormControl());
    this.formBulkSearch.valueChanges.subscribe(x =>{
      this.isValidBulkSearch = !this.formBulkSearch.valid;
    });
  }

  closBulkSearchDialog(dialog: any){
    dialog.closeDialog();
    this.formBulkSearch.reset();
  }

  submitBulkSearch(dialog: any){

    if(this.formBulkSearch.valid) {      
      this.leadDeliveryDetailsDataSource.service = this.leadDeliveryDetailsService;
      this.leadDeliveryDetailsDataSource.bulkSearchValue = this._dsepService.dsepSplit(this.formBulkSearch.value.bulkSearchFieldText);
      this.leadDeliveryDetailsDataSource.bulkSearchField = this.formBulkSearch.value.bulkSearchFieldList;
      this.leadDeliveryDetailsDataSource.filterMethod = 'filterTable';     
      this.leadDeliveryDetailsDataSource.doBulkSearch();
      dialog.closeDialog();     
    }  
  }

  onModelChange(event: any){
    console.log(event);
    }
    updateLDWidgetsStatus() {
        this.leadDeliveryService.invokeLeadsAggregationProcess({ campaignId: this.campaignData["adminCID"] }).subscribe();
    }

}
