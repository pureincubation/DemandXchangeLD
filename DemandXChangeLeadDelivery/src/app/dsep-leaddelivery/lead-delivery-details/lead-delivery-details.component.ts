import { Component, OnInit} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { DSEPComponentService } from "../../../_shared/dsep-components/v0.2/_common/dsep-global-component";
import { DataSourceModel } from "../../../_shared/dsep-components/v0.2/_model/dsep-datasource.model";
import {
  LeadDeliveryStatus, LeadDetailsTable, DeliveryStatus, DeliveryMethod
} from "../_enums/lead-delivery.enum";
import { LeadDetailsService } from "../_services/lead-delivery-details.service";
import { IWidgets } from '../_interfaces/lead-delivery.interface';
import { DSEPToastService } from "../../../_shared/dsep-components/v0.2/notification/dsep-toast/dsep-toast.service";
import { IRequestLeadsList, IRequestPagination, LeadDeliveryColumnId } from '../_interfaces/lead-delivery-details.interface';
import { NotificationsService } from "../../../notifications/notifications.service";
import { AutoPassObjectService } from '../_services/lead-delivery-autopass.service';
import { LandingPageService } from '../../../_services/landing-page.service';
import { FormGroup } from "@angular/forms";
import { DatePipe } from "@angular/common";

@Component({
  selector: "lead-delivery-details",
  templateUrl: `./lead-delivery-details.component.html`,
  styleUrls: [`./lead-delivery-details.component.scss`],
})
export class LeadDetailsComponent implements OnInit {
  inhouse = [
    ["Email", 23],
    ["Telemarketing", 45],
  ];
  formddpGroupGeneric: FormGroup = new FormGroup({});
  partners = [["Partners", 64]];
  channels = ["EMAIL MARKETING", "TELEMARKETING", "PARTNERS"];
  leadDeliveryDetailsDataSource: DataSourceModel;
  notYetDeliveredDataSource: DataSourceModel;
  deliveryQueueDataSource: DataSourceModel;
  deliveredDataSource: DataSourceModel;
  allLeadsDataSource: DataSourceModel;
  unqualifiedLeadsDataSource: DataSourceModel;
  leadQaQueueDataSource: DataSourceModel;
  deliveryerrorsDataSource: DataSourceModel;
  statusEnum: any = LeadDeliveryStatus;
  deliveryStatusEnum: any = DeliveryStatus;
  isCollapsiblePanel: boolean = true;
  campaignId: number = 0;
  isCollapsed = false;
  gridWidgetDetails: IWidgets[];
  toggleText: "Hide" | "Show" = "Hide";
  toggleIcon: "expand_less" | "expand_more" = "expand_less";
  isDeliveredLeads: boolean = true;
  campaignData: Object = {};
  deliveredUsers: any[] = [];
  campaignDetailsTitle: string = "Lead Delivery";
  emailMarketingData = [];
  telemarketingData = [];
  partnersData = [];
  activeTabIndex = 0;
  segmentID: string;
  widgetsPullData: Object = {};
  deliveryMethod = DeliveryMethod;
  leadDeliveryRouteParams:any;
  leadsRefreshStatusTimeStamp: string = '';

  constructor(
    private leadService: LeadDetailsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private toastService: DSEPToastService,
    private _dsepService: DSEPComponentService,
    private notifSvc: NotificationsService,
    private route: ActivatedRoute,
    private autopassSvc: AutoPassObjectService,
    private datePipe: DatePipe,
    private landingPageSvc: LandingPageService,
  ) {

    this.segmentID = String(this.activatedRoute.snapshot.paramMap.get("id"));
  }
  monthlyPacing: any;
  progressLeadData: Object = {};
  ngOnInit() {
    let objData = this.route.snapshot.data.campaignData;
    this.progressLeadData = {
         overall: {},
         channels: []
    }
    if(objData["data"] && objData["data"]["campaign"]){
      let campData = objData["data"]["campaign"];
      this.campaignData["deliverySchedule"] = campData.deliveryFrequencies.join(",");
      this.campaignData["pxCampaignId"]= campData.pxCampaignID;
    }

    if(objData["data"] && objData["data"]["segment"]){
      let setgmentData = objData["data"]["segment"];

     
     
      this.campaignId = setgmentData.adminCampaignID;
      this.campaignData["adminCID"] = this.campaignId;
      this.campaignData["segmentData"] = setgmentData;
      this.campaignDetailsTitle = `${setgmentData.pxSegmentID} - ${setgmentData.segmentName}`;
      this.leadDeliveryRouteParams = [{
        path:"LeadsDelivery",
        params:[setgmentData.pxCampaignID],
        label: setgmentData.pxCampaignID
      }];

      this.onToggleAutoPass(setgmentData["autoPassEnabled"]);
      this.campaignData["deliveryMethod"] = setgmentData.deliveryMethod;
      this.widgetsPullData = {
        agingUndelivered: setgmentData.agingUndelivered,
        leadsDelivered: setgmentData.leadsDelivered,
        leadsNotYetDelivered: setgmentData.leadsNotYetDelivered,
        leadsToDeliver: setgmentData.leadsToDeliver,
        leadsReturned:setgmentData.leadsReturned
      }
      this.notifSvc.setPageBusy(false);
    }
    this.processWidgetAndProgress();
    this.processDatasource();

    /*
    Removing this as initial tab is always not yet delivered
    if(this.campaignData['deliveryMethod']==this.deliveryMethod.Autopass || this.campaignData['deliveryMethod']==this.deliveryMethod['Autopass and Manual']){
        this.deliveredDataSource.loadData();
    }*/
    
    this.notYetDeliveredDataSource.loadData();
  }

  onToggleAutoPass(value: boolean){
    this.campaignData["segmentData"]["autoPassEnabled"] = value;
    this.autopassSvc.onAutoPassToggle(value);
  }

  reloadWidgetsStatus(){
    this.leadService.getLeadsGridWidgets({
      "PXCampaignId": "",
      "PXSegmentId": "",
      "AdminCampaignId": this.campaignId
    }).subscribe(objWidgetList => {
          this.gridWidgetDetails = objWidgetList["data"];
          this.leadService.getLeadsStatsMaterializationLogs(this.campaignId).subscribe(obj => {
            let valDate = '';
            if(obj.data){
              valDate = obj.data.completedOn.replace('Z','');
              this.leadsRefreshStatusTimeStamp = `Last Data Available: ${this.datePipe.transform(valDate, "MM/dd/yyyy hh:mm")}`;
              
              if(!obj.data.processed){
                 this.gridWidgetDetails.forEach(iwidget => {
                       iwidget.count = "--";
                 });  
              }
            }
          });
    });
  }

  processWidgetAndProgress(){
    this.reloadWidgetsStatus();
    this.leadService.getLeadsSegmentProgress({
      "PXCampaignId": "",
      "PXSegmentId": this.segmentID,
      "AdminCampaignId": this.campaignId
    }).subscribe(objData => {
        let dataOverAll = {percentage: 0, name:"Overall", color: "", numerator: 0, denominator: 0};
        let dataEmailProgress = {percentage: 0, name:"Email", color: "", numerator: 0, denominator: 0};
        let dataTelemarketing = {percentage: 0, name:"Telemarketing", color: "", numerator: 0, denominator: 0, linkName: 'View Sites', views: [], disabled: true};
        let dataPartner = {percentage: 0, name:"Partner", color: "", numerator: 0, denominator: 0, linkName: 'View Partners', views: [], disabled: true};
        let channels = [];

        if(objData){
           let overallData = objData["overallProgress"];
           if(overallData){
              dataOverAll.percentage = overallData["percentage"]? overallData["percentage"] : 0;
              dataOverAll.numerator = overallData["numerator"]? overallData["numerator"] : 0;
              dataOverAll.denominator = overallData["denominator"]? overallData["denominator"] : 0;
              if(dataOverAll.percentage < 30){
                dataOverAll.color = "warn"
              }
              if(dataOverAll.percentage >= 30 && dataOverAll.percentage <= 60){
                dataOverAll.color = "accent"
              }
              if(dataOverAll.percentage > 60 ){
                dataOverAll.color = "primary"
              }

           }

           let emailData = objData["emailProgress"];
           if(emailData){
              dataEmailProgress.percentage = emailData["percentage"]? emailData["percentage"] : 0;
              dataEmailProgress.numerator = emailData["numerator"]? emailData["numerator"] : 0;
              dataEmailProgress.denominator = emailData["denominator"]? emailData["denominator"] : 0;
           }


           let tmOverall = objData["telemarketingOverallProgress"];
           if(tmOverall){
            dataTelemarketing.percentage = tmOverall["percentage"]? tmOverall["percentage"] : 0;
            dataTelemarketing.numerator = tmOverall["numerator"]? tmOverall["numerator"] : 0;
            dataTelemarketing.denominator = tmOverall["denominator"]? tmOverall["denominator"] : 0;
            let tmViewSites = objData["telemarketingSitesProgress"];
            if(tmViewSites && tmViewSites.length > 0){
              dataTelemarketing.views = tmViewSites;
              dataTelemarketing["disabled"] = false;
            }

          }


          let partnerOverall = objData["partnerOverallProgress"];
          if(partnerOverall){
            dataPartner.percentage = partnerOverall["percentage"]? partnerOverall["percentage"] : 0;
            dataPartner.numerator = partnerOverall["numerator"]? partnerOverall["numerator"] : 0;
            dataPartner.denominator = partnerOverall["denominator"]? partnerOverall["denominator"] : 0;
           let partnerViewSites = objData["partnersProgress"];
           if(partnerViewSites && partnerViewSites.length > 0){
              dataPartner.views = partnerViewSites;
              dataPartner["disabled"] = false;
           }
         }
        }
        channels.push(dataEmailProgress);
        channels.push(dataTelemarketing);
        channels.push(dataPartner);
        this.progressLeadData["overall"] = dataOverAll;
        this.progressLeadData["channels"] = channels;

    });
  }
  processDatasource(){

    let notyetDeliveredParam:IRequestLeadsList = { pagination: { includeTotal: true, skip: 0, take : 10 } as IRequestPagination,
    deliveryStatus: DeliveryStatus["Not Yet Delivered"], campaignId: this.campaignId,includeUnqualifiedReasons: true } as IRequestLeadsList;

    this.notYetDeliveredDataSource = new DataSourceModel(this.leadService);
    this.notYetDeliveredDataSource.isProxy = true;
    this.notYetDeliveredDataSource.method = "getLeadNotYetDeliveredList";
    this.notYetDeliveredDataSource.params = notyetDeliveredParam;
    this.notYetDeliveredDataSource.isAutoLoad = false;
    this.notYetDeliveredDataSource.columnDef = LeadDeliveryColumnId;
    this.notYetDeliveredDataSource.filterMethod = "filterTable";
    this.notYetDeliveredDataSource.dataTotalCount = 0;
    this.notYetDeliveredDataSource.exportMethod = "exportDeliveryLeads";
    this.notYetDeliveredDataSource.exportParams = {
      deliveryStatus: DeliveryStatus["Not Yet Delivered"]
    };
    this.notYetDeliveredDataSource.onExportCallBack.subscribe((a) => {
        if(a){
            this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
        }
    });


    let deliveryQueueParam:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
                          deliveryStatus: DeliveryStatus["For Delivery"], campaignId: this.campaignId,includeUnqualifiedReasons: true } as IRequestLeadsList;

    this.deliveryQueueDataSource = new DataSourceModel(this.leadService);
    this.deliveryQueueDataSource.isProxy = true;
    this.deliveryQueueDataSource.method = "getLeadDeliveryQueueList";
    this.deliveryQueueDataSource.params = deliveryQueueParam;
    this.deliveryQueueDataSource.isAutoLoad = false;
    this.deliveryQueueDataSource.columnDef = LeadDeliveryColumnId;
    this.deliveryQueueDataSource.exportMethod = "exportDeliveryLeads";
    this.deliveryQueueDataSource.exportParams = {
      deliveryStatus: DeliveryStatus["For Delivery"]
    };
    this.deliveryQueueDataSource.filterMethod = "filterTable";
    this.deliveryQueueDataSource.dataTotalCount = 0;
    this.deliveryQueueDataSource.onExportCallBack.subscribe((a) => {
        if(a){
            this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
        }
    });

    let deliveredParam:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
        deliveryStatus: DeliveryStatus.Delivered, campaignId: this.campaignId,includeUnqualifiedReasons: true,IsClientRejected:true,IsNeedReplacement:true } as IRequestLeadsList;

    this.deliveredDataSource = new DataSourceModel(this.leadService);
    this.deliveredDataSource.isProxy = true;
    this.deliveredDataSource.method = "getLeadDeliveredList";
    this.deliveredDataSource.isAutoLoad = false;
    this.deliveredDataSource.params = deliveredParam;
    this.deliveredDataSource.columnDef = LeadDeliveryColumnId;
    this.deliveredDataSource.exportMethod = "exportDeliveryLeads";
    this.deliveredDataSource.exportParams = {
      deliveryStatus: DeliveryStatus.Delivered
    };
    this.deliveredDataSource.filterMethod = "filterTable";
    this.deliveredDataSource.dataTotalCount = 0;
    this.deliveredDataSource.onExportCallBack.subscribe((a) => {
        if(a){
            this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
        }
    });

    let allLeadsParam:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
    deliveryStatus: DeliveryStatus['All'], campaignId: this.campaignId,includeUnqualifiedReasons: true,IsClientRejected:true,IsNeedReplacement:true } as IRequestLeadsList;
    this.allLeadsDataSource = new DataSourceModel(this.leadService);
    this.allLeadsDataSource.isProxy = true;
    this.allLeadsDataSource.method = "getAllLeadsList";
    this.allLeadsDataSource.isAutoLoad = false;
    this.allLeadsDataSource.params = allLeadsParam;
    this.allLeadsDataSource.columnDef = LeadDeliveryColumnId;
    this.allLeadsDataSource.exportMethod = "exportDeliveryLeads";
    this.allLeadsDataSource.exportParams = {
      deliveryStatus: DeliveryStatus.All
    };
    this.allLeadsDataSource.filterMethod = "filterTable";
    this.allLeadsDataSource.dataTotalCount = 0;
    this.allLeadsDataSource.onExportCallBack.subscribe((a) => {
      if(a){
          this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
      }
     
    });
    

    let unqualifiedLeadsParam:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
    deliveryStatus: DeliveryStatus.All, campaignId: this.campaignId,
    filterCriteria: [{
      type: "Enum",
      fieldCode: 4,
      enumValue: [
        {
          isFiltered: true,
          text: "Unqualified",
          value: "3"
        },
        {
          isFiltered: true,
          text: "UnderReview",
          value: "2"
        }]
    }],
    includeUnqualifiedReasons: true } as IRequestLeadsList;

    this.unqualifiedLeadsDataSource = new DataSourceModel(this.leadService);
    this.unqualifiedLeadsDataSource.isProxy = true;
    this.unqualifiedLeadsDataSource.method = "getUnqualifiedLeadsList";
    this.unqualifiedLeadsDataSource.isAutoLoad = false;
    this.unqualifiedLeadsDataSource.params = unqualifiedLeadsParam;
    this.unqualifiedLeadsDataSource.columnDef = LeadDeliveryColumnId;
    this.unqualifiedLeadsDataSource.exportMethod = "exportDeliveryLeads";
    this.unqualifiedLeadsDataSource.exportParams = {
      deliveryStatus: DeliveryStatus.All
    };
    this.unqualifiedLeadsDataSource.filterMethod = "filterTableUnqualified";
    this.unqualifiedLeadsDataSource.dataTotalCount = 0;
    this.unqualifiedLeadsDataSource.onExportCallBack.subscribe((a) => {
      if(a){
          this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
      }
    });

    let errorsParam:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
    deliveryStatus: DeliveryStatus.Error, campaignId: this.campaignId } as IRequestLeadsList;

    this.deliveryerrorsDataSource = new DataSourceModel(this.leadService);
    this.deliveryerrorsDataSource.isProxy = true;
    this.deliveryerrorsDataSource.method = "getLeadErrorsList";
    this.deliveryerrorsDataSource.isAutoLoad = false;
    this.deliveryerrorsDataSource.params = errorsParam;
    this.deliveryerrorsDataSource.columnDef = LeadDeliveryColumnId;
    this.deliveryerrorsDataSource.exportMethod = "exportDeliveryLeads";
    this.deliveryerrorsDataSource.exportParams = {
      deliveryStatus: DeliveryStatus.Error
    };
    this.deliveryerrorsDataSource.filterMethod = "filterTable";
    this.deliveryerrorsDataSource.dataTotalCount = 0;
    this.deliveryerrorsDataSource.onExportCallBack.subscribe((a) => {
      if(a){
        this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
      }
    });

    let inLeadQAParams:IRequestLeadsList = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination,
    deliveryStatus: DeliveryStatus['All'], campaignId: this.campaignId, exportType: 'leadsinleadqa' } as IRequestLeadsList;
    this.leadQaQueueDataSource = new DataSourceModel(this.leadService);
    this.leadQaQueueDataSource.isProxy = true;
    this.leadQaQueueDataSource.method = "getLeadQaQueueData";
    this.leadQaQueueDataSource.filterMethod = "filterLeadQAQueueTab";
    this.leadQaQueueDataSource.isAutoLoad = false;
    this.leadQaQueueDataSource.params = inLeadQAParams;
    this.leadQaQueueDataSource.columnDef = LeadDeliveryColumnId;
    this.leadQaQueueDataSource.exportMethod = "exportDeliveryLeads";
    this.leadQaQueueDataSource.exportParams = {
      deliveryStatus: DeliveryStatus.All
    };
    this.leadQaQueueDataSource.dataTotalCount = 0;
    this.leadQaQueueDataSource.onExportCallBack.subscribe((a) => {
      if(a){
          this.toastService.openSuccessfulMessage("Exporting data. You will receive the report in your email shortly.", 5000);
      }
    });

  }

  togglePanel() {
    let pnl = this._dsepService.getComponent("lead-delivery-details-top-panel");
    pnl.isCollapsiblePanel = true;
    pnl.togglePanel();
    if (pnl.isCollapsed) {
      this.toggleText = "Show";
      this.toggleIcon = "expand_more";
    } else {
      this.toggleText = "Hide";
      this.toggleIcon = "expand_less";
    }
    this.isCollapsed = pnl.isCollapsed;
  }

  onWidgetClick(event: any) { }

  onClickTab(ev) {
    this.activeTabIndex = ev.index;
  }

  onTabChangeLoadData(event: any){
    if(this.campaignData['deliveryMethod']==this.deliveryMethod.Autopass || this.campaignData['deliveryMethod']==this.deliveryMethod['Autopass and Manual']){
      switch(event.index) {
        case 0:{
          this.onToggleAutoPass(this.campaignData["segmentData"]["autoPassEnabled"]);
          this.deliveredDataSource.loadData();
          break;
        }
        case 1: {
          this.onToggleAutoPass(this.campaignData["segmentData"]["autoPassEnabled"]);
          this.allLeadsDataSource.loadData();
          break;
        }
        case 2: {
          this.onToggleAutoPass(this.campaignData["segmentData"]["autoPassEnabled"]);
          this.deliveryerrorsDataSource.loadData();
          break;
        }
        case 3:{
          this.onToggleAutoPass(this.campaignData["segmentData"]["autoPassEnabled"]);
          this.unqualifiedLeadsDataSource.loadData();
          break;
        }
      }
    }

    if(this.campaignData['deliveryMethod']!==this.deliveryMethod.Autopass && this.campaignData['deliveryMethod']!==this.deliveryMethod['Autopass and Manual']){
      switch(event.index) {
        case 0:{
           this.notYetDeliveredDataSource.loadData();
           break;
        }
        case 1:{
           this.deliveryQueueDataSource.loadData();
           break;
        }
        case 2:{
          this.deliveredDataSource.loadData();
          break;
        }
        case 3:{
          this.allLeadsDataSource.loadData();
          break;
        }
        case 4:{
          this.unqualifiedLeadsDataSource.loadData();
          break;
        }
        case 5:{
          this.leadQaQueueDataSource.loadData();
          break;
        }
      }
    }
  
  }
  openToCampaignLaunchPage() {
          let routeUrl: string = '';
            if (this.segmentID){
            this.landingPageSvc.getCampaignInfoForClientCompany(this.segmentID).subscribe(res =>{
                routeUrl = `CampaignLaunch/segments/${this.campaignData["pxCampaignId"]}/${this.segmentID}/PXT-${res["taskId"]}`;
                window.open(routeUrl,'blank')
              })
            }
        }
  }

        

