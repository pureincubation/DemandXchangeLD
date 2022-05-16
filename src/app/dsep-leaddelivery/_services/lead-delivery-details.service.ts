import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import { DSEPComponentService } from '../../../_shared/dsep-components/v0.2/_common/dsep-global-component';
import { LeadDeliveryColumns, LeadUserPersona, IWidgets } from '../_interfaces/lead-delivery.interface';
import { LeadDeliveryStatus, AllLeadsDeliveryStatus, DeliveryStatus, LeadStatus, DismissedEnum } from '../_enums/lead-delivery.enum';
import { IResponseLeadDetailsList, IResponseLeadDetailsCount, LeadDetailListColumn, RequestLeadStatus, RequestRepostStatus, ISegmentWidgetLeadsStatus, ILeadsStatisticsProcessLogModel, IResponseDataStats } from '../_interfaces/lead-delivery-details.interface';
import { LDSampleCampaigns } from './lead-delivery.service';
import { GlobalsService } from '../../../_core/globals.service';
import { map } from 'rxjs/operators';
import { PortalAuthenticationService } from './../../../_services/dsep-portal-auth.service';
import { ILeadsExport } from '../_interfaces/leads-export.interface';
import { reason } from '../../dsep-purexchange/_constants/reason.constants';

@Injectable({
  providedIn: 'root'
})
export class LeadDetailsService {

  constructor(private _cmpGlobalSvc: DSEPComponentService, private httpClient: HttpClient, private globalSvc: GlobalsService, private authService: PortalAuthenticationService) { }
  API_Main_URL = this.globalSvc.env.appConfig.leadDelivery.mainUrl;
  API_PXLeads_Micro = this.globalSvc.env.appConfig.pureXchangeApp.leadMicroUrl;
  API_URI = this.API_Main_URL + '/LeadDelivery';
  API_Export_URI = this.API_Main_URL + '/LeadDeliveryExport';
  API_PXSegment_URI = this.API_Main_URL + '/PXSegment';
  API_PXCampaing_URI = this.API_Main_URL + '/PXCampaign'
  API_LeadsURI = this.globalSvc.env.appConfig.leadDelivery.leadMicroUrl + '/Leads';
  campaignData: Object;
  getLeads() {
    let url = this.API_URI + '/leadList';
    return this.httpClient.get(url, {}).map(res =>{})
  }

  getLeadsDatasource(params: {}) {

    let url = this.API_URI + '/getLeadDeliveries';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);

  }

  exportLead(params: {}) {
    let url = this.API_Export_URI + '/export';
    // const email = this.authService.loggedOnUser.email;
    const email = 'pxtest@demandscience.com';
    const exportValue: ILeadsExport = {
      ExportType: params['exportType'] ? params['exportType'] : "leaddeliveries",
      CampaignID: params['campaignId'],
      FilterCriteria: params['filterCriteria'],
      Columns: params['visibleColumns'],
      Email: email,
      DeliveryStatus: params['deliveryStatus'],
      Sort: params['sort']
    }
    return this.httpClient.post(url, exportValue);
  }

  setLeadPrepColumn(data: any){
      data["autopasslog"] = {};
      if(data["autopassRequestLog"] && data["autopassResponseLog"]){
        data["autopasslog"] = { text: "Request: " + data["autopassRequestLog"] + ' ********************* ' + "Response: " + data["autopassResponseLog"], link: "View" }
      }
      return data;
  }

  getLeadTabData(res: {}){

    if(res["data"].items && res["data"].items.length > 0){
      res["data"].items.forEach((objItem => {
        if(res["data"].customQuestionHeaders && res["data"].customQuestionHeaders.length > 0){
          res["data"].customQuestionHeaders.forEach(cqHeader => {
            let ans = (objItem["customQuestionAnswers"].find(a => a.questionId === cqHeader.questionId)).leadResponses;
            let answer: string = '';
            ans.forEach(objAns => {
              answer += objAns.name;
            });

            objItem[cqHeader["questionId"]] = answer ? answer : '....';
          });
        }
        objItem = this.setLeadPrepColumn(objItem);
      }).bind(this));
    }

    let dataObj: any = { data: res["data"].items }
    if (res["data"].totalCount) {
      dataObj["totalCount"] = res["data"].totalCount;
    }

    if (res["data"].customQuestionHeaders) {
      dataObj["customQuestionHeaders"] = res["data"].customQuestionHeaders;
    }

    return dataObj;
  }

  getDeliveryQueueWidgets(params:{}): Observable<any[]>{
    return new Observable<any[]>((observer) => {});
  }

  filterTable(params: any): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = params.deliveryStatus === 0 ? this.prepareLeadColumns(lead) : this.prepareColumns(lead);
          return column;
        });
        observer.next(leads);
      })
    });
  }

  filterTableUnqualified(params: any): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      /*if (params['includeUnqualifiedReasons']) {
        let uqFilter = {
          "type": "Enum",
          "fieldCode": 4,
          "enumValue": [
            {
              "isFiltered": true,
              "text": "Unqualified",
              "value": "3"
            },
            {
              isFiltered: true,
              text: "UnderReview",
              value: "2"
            }]
        };
        if(params['filterCriteria'][0].type !== 'Enum') {
          params['filterCriteria'].unshift(uqFilter);
        }
      }*/
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = params.deliveryStatus === 0 ? this.prepareLeadColumns(lead) : this.prepareColumns(lead);
          return column;
        });
        observer.next(leads);
      })
    });
  }


  filterLeadQAQueueTab(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      let url = this.API_URI + '/getleadsinleadqa';
      this.httpClient.post<IResponseLeadDetailsList>(url, params).subscribe(objResp => {
        let allLeads = this.getLeadTabData(objResp);
        let preparedLeads = allLeads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          column.unqualifiedReason = column.unqualifiedReason ? column.unqualifiedReason : '';
          return column;
        });
        observer.next(allLeads);
      });
    });
  }

  getLeadNotYetDeliveredList(params: any): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = this.prepareColumns(lead);
          return column;
        });
        observer.next(leads);
        // observer.next(this.getLeadTabData(objResp));
      })
    });
  }

  getLeadDeliveryQueueList(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = this.prepareColumns(lead);
          return column;
        });
        observer.next(leads);
        //observer.next(this.getLeadTabData(objResp));
      })
    });
  }
  getLeadDeliveredList(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = this.prepareColumns(lead);
          return column;
        });
        observer.next(leads);
        //observer.next(this.getLeadTabData(objResp));
      })
    });
  }

  getAllLeadsList(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let allLeads = this.getLeadTabData(objResp);
        let preparedLeads = allLeads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          return column;
        });
        observer.next(allLeads);
        // observer.next(this.getLeadTabData(objResp));
      })
    });
  }
  getUnqualifiedLeadsList(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let allLeads = this.getLeadTabData(objResp);
        let preparedLeads = allLeads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          column.unqualifiedReason = column.unqualifiedReason ? column.unqualifiedReason : '';
          return column;
        });
        observer.next(allLeads);
        // observer.next(this.getLeadTabData(objResp));
      })
    });
  }

  getLeadQaQueueData(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      let url = this.API_URI + '/getleadsinleadqa';
      this.httpClient.post<IResponseLeadDetailsList>(url, params).subscribe(objResp => {
        let allLeads = this.getLeadTabData(objResp);
        let preparedLeads = allLeads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          column.unqualifiedReason = column.unqualifiedReason ? column.unqualifiedReason : '';
          return column;
        });
        observer.next(allLeads);
      });
    });
  }

  getLeadErrorsList(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getLeadsDatasource(params).subscribe(objResp => {
        let leads = this.getLeadTabData(objResp);
        let preparedLeads = leads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          column.unqualifiedReason = column.unqualifiedReason ? column.unqualifiedReason : '';
          return column;
        });
        observer.next(leads);
        //observer.next(this.getLeadTabData(objResp));
      });
    });
  }
  getUnqualifiedReasons(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      const reasonData: any = {data:[{reason:"Out Of Filter", details:"Industry"},{reason:"Out Of Filter", details:"Job Function"},
      {reason:"Out Of Filter", details:"Job Area"},{reason:"CQ Response", details:"6330, 6331"}]}


      observer.next(reasonData);
      /*this.getLeadsDatasource(params).subscribe(objResp => {
        let allLeads = this.getLeadTabData(objResp);
        let preparedLeads = allLeads.data.map(lead => {
          const column = this.prepareLeadColumns(lead);
          return column;
        });
        observer.next(allLeads);
        // observer.next(this.getLeadTabData(objResp));
      })*/
    });
  }
  prepareColumns(lead){

    if(!this._cmpGlobalSvc.isObject(lead.deliveryStatus)){
      let obj = {value: lead.deliveryStatus, clsColor: ''}
      if(lead.deliveryStatus === DeliveryStatus['All']){
        obj.clsColor = '';
      }
      if(lead.deliveryStatus === DeliveryStatus["Not Yet Delivered"]){
        obj.clsColor = 'chip-color-blue';
      }

      if(lead.deliveryStatus === DeliveryStatus["For Delivery"]){
        obj.clsColor = 'chip-color-amber';
      }

      if(lead.deliveryStatus === DeliveryStatus.Delivered){
        obj.clsColor = 'chip-color-green';
      }
      if(lead.deliveryStatus === DeliveryStatus.Error){
        obj.clsColor = 'chip-color-red';
      }
      lead.deliveryStatus = obj;
    }


    if(!this._cmpGlobalSvc.isObject(lead.status)){
      let statusObj = {value: lead.status, clsColor: ''}
      if(lead.status === AllLeadsDeliveryStatus['Unqualified']){
        statusObj.clsColor = 'chip-color-red';
      }
      if(lead.status === AllLeadsDeliveryStatus["UnderReview"]){
        statusObj.clsColor = 'chip-color-blue';
      }

      if(lead.status === AllLeadsDeliveryStatus['Returned']){
        statusObj.clsColor = 'chip-color-amber';
      }else{
        lead.reasonForReturn = "";
      }

      if(lead.status === AllLeadsDeliveryStatus['Qualified']){
        if(lead.unqualifiedDetails && lead.unqualifiedDetails["uqReasons"].length > 0){
          statusObj.clsColor = 'chip-color-custom-w-reason';
        }else{
          statusObj.clsColor = 'chip-color-green';
        }
      }


      if(lead.status === AllLeadsDeliveryStatus['In Lead QA']){
        statusObj.clsColor = 'chip-color-green';
        lead['disabled'] = true;
      }

      lead.status = statusObj;
    }

    let uqDetails = lead["unqualifiedDetails"];
    lead["tooltipreason"] = [];
    if(uqDetails && (uqDetails["uqReasons"] && uqDetails["uqReasons"].length > 0)){
      let reasonTooltip = lead["unqualifiedDetails"]["uqReasons"];
      lead["tooltipreason"]= reasonTooltip.map(a=>{return a["reason"]+ ' ' + a["detail"]+ ';'}).join('\n');
    }

    let returnReason = lead["unqualifiedDetails"];
    lead["tooltipreturnreason"] = [];
    if(returnReason && (returnReason["reasonForReturn"] && returnReason["reasonForReturn"].length > 0)){
      let returnreasonTooltip = lead["unqualifiedDetails"]["reasonForReturn"];
      lead["tooltipreturnreason"]= returnreasonTooltip;
    }

    /*if(!this._cmpGlobalSvc.isObject(lead.status)){
      let statusObj = {value: lead.status, clsColor: ''}
      if(lead.status === LeadStatus.Unqualified){
        statusObj.clsColor = 'chip-color-red';
      }
      if(lead.status === LeadStatus.Qualified){
        statusObj.clsColor = 'chip-color-green';
      }
      lead.status = statusObj;
    }*/

    if(!this._cmpGlobalSvc.isObject(lead.dismissed)){
      let statusObj ={value: lead.dismissed ? 1 : 0 , clsColor: ''}
      if(statusObj.value === DismissedEnum.Yes){
        statusObj.clsColor = 'chip-color-green';
      }
      lead.dismissed = statusObj;
    }
    return lead;
  };

  prepareLeadColumns(lead){
    if(!this._cmpGlobalSvc.isObject(lead.deliveryStatus)){
      let obj = {value: lead.deliveryStatus, clsColor: ''}
      if(lead.deliveryStatus === DeliveryStatus['All']){
        obj.clsColor = '';
      }
      if(lead.deliveryStatus === DeliveryStatus["Not Yet Delivered"]){
        obj.clsColor = 'chip-color-blue';
      }

      if(lead.deliveryStatus === DeliveryStatus["For Delivery"]){
        obj.clsColor = 'chip-color-amber';
      }

      if(lead.deliveryStatus === DeliveryStatus.Delivered){
        obj.clsColor = 'chip-color-green';
      }
      if(lead.deliveryStatus === DeliveryStatus.Error){
        obj.clsColor = 'chip-color-red';
      }
      lead.deliveryStatus = obj;
    }

    let uqDetails = lead["unqualifiedDetails"];
    lead["tooltipreason"] = [];
    if(uqDetails && (uqDetails["uqReasons"] && uqDetails["uqReasons"].length > 0)){
      let reasonTooltip = lead["unqualifiedDetails"]["uqReasons"];
      lead["tooltipreason"]= reasonTooltip.map(a=>{return a["reason"]+ ' ' + a["detail"]+ ';'}).join('\n');
    }

    let returnReason = lead["unqualifiedDetails"];
    lead["tooltipreturnreason"] = [];
    if(returnReason && (returnReason["reasonForReturn"] && returnReason["reasonForReturn"].length > 0)){
      let returnreasonTooltip = lead["unqualifiedDetails"]["reasonForReturn"];
      lead["tooltipreturnreason"]= returnreasonTooltip;
    }

    if(!this._cmpGlobalSvc.isObject(lead.status)){
      let statusObj = {value: lead.status, clsColor: ''}
      if(lead.status === AllLeadsDeliveryStatus['Unqualified']){
        if(!lead.dismissed){
          statusObj.clsColor = 'chip-color-custom-uqnotdismissed';
        }else{
          statusObj.clsColor = 'chip-color-red';
        }
      }
      if(lead.status === AllLeadsDeliveryStatus["UnderReview"]){
        statusObj.clsColor = 'chip-color-blue';
      }

      if(lead.status === AllLeadsDeliveryStatus['Returned']){
        statusObj.clsColor = 'chip-color-amber';
      }else{
        lead.reasonForReturn = "";
      }

      if(lead.status === AllLeadsDeliveryStatus['Qualified']){
        if(lead.unqualifiedDetails && lead.unqualifiedDetails["uqReasons"].length > 0){
          statusObj.clsColor = 'chip-color-custom-w-reason';
        }else{
          statusObj.clsColor = 'chip-color-green';
        }
      }

      if(lead.status === AllLeadsDeliveryStatus['In Lead QA']){
        statusObj.clsColor = 'chip-color-green';
        lead['disabled'] = true;
      }

      lead.status = statusObj;
    }
    if(!this._cmpGlobalSvc.isObject(lead.dismissed)){
      let statusObj ={value: lead.dismissed ? 1 : 0 , clsColor: ''}
      if(statusObj.value === DismissedEnum.Yes){
        statusObj.clsColor = 'chip-color-green';
      }
      lead.dismissed = statusObj;
    }
    return lead;
  };

  getLeadsStatusWidgets(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      let statusList: any = LeadeDeliveryStatusSamle.slice(params["skip"], params["take"]);

      const statusData: any = { data: statusList }
      observer.next(statusData);

    });
  }

  getLeadsSegmentProgress(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      let url = this.API_PXSegment_URI + '/GetSegmentProgress';
      this.httpClient.post<IResponseLeadDetailsList>(url, params).subscribe(objResponse => {
        const resData = objResponse.data.items[0]?objResponse.data.items[0]: [];
        observer.next(resData);
      });

    });
  }

  getLeadsStatsMaterializationLogs(campaignId: number){
      let url = this.API_PXLeads_Micro + `/leadsPerformer/getCampaignStatsLatestMaterializationLog/${campaignId}`;
      return this.httpClient.get<IResponseDataStats>(url)
  }

  getLeadsGridWidgets(params: {}): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      let url = this.API_PXSegment_URI + '/getPXSegmentLeadsStatus';
      this.httpClient.post<ISegmentWidgetLeadsStatus>(url, params).subscribe(objResponse => {
        const resData = objResponse.data.items[0];
        const gridsList = [
          { count: resData.ordered? resData.ordered: 0, refCode: 'ordered', title: 'Ordered', color: "#2196F3", showHelpIcon: true, tooltipText: 'Total lead order for this campaign' },
          { count: resData.gross? resData.gross: 0, refCode: 'gross', title: 'Gross', color: "#2196F3", showHelpIcon: true, tooltipText: 'All leads produced for this campaign' },
          { count: resData.underReviewUQNYD? resData.underReviewUQNYD: 0, refCode: 'underReviewUQNYD', title: 'UQ NYD', color: "orange", showHelpIcon: true, tooltipText: 'Leads that are unqualified and not yet dismissed (pending manual qualification or dismissal)' },
          { count: resData.underReviewInQA? resData.underReviewInQA: 0, refCode: 'underReviewInQA', title: 'In QA', color: "orange", showHelpIcon: true, tooltipText: 'Leads that are in Lead QA queue' },          
          { count: resData.qualified? resData.qualified: 0, refCode: 'qualified', title: 'Qualified', color: "#2196F3", showHelpIcon: true, tooltipText: 'Good leads, both pending delivery to the client and those that have been delivered to the client and have not been rejected' },
          { count: resData.uqDismissedInternalReturns? resData.uqDismissedInternalReturns: 0, refCode: 'uqDismissedInternalReturns', title: 'UQ Dismissed and Internal Returns', color: "#C62828", showHelpIcon: true, tooltipText: 'Leads that are Unqualified and Dismissed including Internal Returns' },
          { count: resData.clientAccepted? resData.clientAccepted: 0, refCode: 'clientAccepted', title: 'Client Accepted', color: '#2196F3', showHelpIcon: true, tooltipText: 'Leads that are Delivered and Client Accepted (including presumed accepted / not returned by clients)' },
          { count: resData.clientRejected? resData.clientRejected: 0, refCode: 'clientRejected', title: 'Client Returned', color: '#C62828', showHelpIcon: true, tooltipText: 'Leads that are Delivered but returned by client or rejected in the client’s platform, and tagged as Client Returned by CX/CS' },
          { count: resData.outstanding? resData["outstanding"]: 0, refCode: 'outstanding', title: 'Outstanding Delivery', color: "#2196F3", showHelpIcon: true, tooltipText: 'Remaining number of leads yet to be accepted by client' }
        ]

        const dataObj: any = { data: gridsList }
        observer.next(dataObj);
      });
    });
  }

  leadExportDownload(params: {}):Observable<string> {
    return this.httpClient.get<string>( this.API_Export_URI + `/getPresignedURL/${params["id"]}`)
  }

  exportDeliveryLeads(params: {}): Observable<number> {
    return new Observable<number>((observer) => {
      this.exportLead(params).subscribe(objResp => {
        observer.next(objResp['data'].success);
      });
    });
  }

  leadDeliveryChangesStatus(param: RequestLeadStatus): Observable<IResponseLeadDetailsCount>{
    let url = this.API_LeadsURI + '/updateStatus';
    return this.httpClient.patch<IResponseLeadDetailsCount>(url, param);
  }

  addLeadsToDeliveryQueue(params: RequestLeadStatus): Observable<number>{
    return new Observable<number>((observer) => {
      this.leadDeliveryChangesStatus(params).subscribe((objRes: IResponseLeadDetailsCount) => {
        observer.next(objRes.data.count);
      })
    });
  }

  removeLeadsFromDeliveryQueue(params: RequestLeadStatus): Observable<number>{
    return new Observable<number>((observer) => {
      this.leadDeliveryChangesStatus(params).subscribe((objRes: IResponseLeadDetailsCount) => {
        observer.next(objRes.data.count);
      })
    });
  }

  toggleSubmitAutoPassState(params: {}){
    let url = this.API_Main_URL + '/LeadDelivery/updateSegmentDeliverySetting';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  submitLeadsRepost(params: RequestRepostStatus){
    let url = this.API_Main_URL + '/LeadDelivery/postAutopassLeads';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  submitUnreturnLeads(params:{}){
    let url = this.API_Main_URL + "/Leads/unreturnLeads";
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }
  submitLeadsAsDismissed(params:{}){
    let url = this.API_Main_URL + '/Leads/DismissLeads';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  submitLeadsAsDelivered(params: RequestLeadStatus): Observable<number>{
    return new Observable<number>((observer) => {
      this.leadDeliveryChangesStatus(params).subscribe((objRes: IResponseLeadDetailsCount) => {
        observer.next(objRes.data.count);
      })
    });
  }

  notifyCXM(param: any): Observable<number>{
    return new Observable<number>((observer) => {
      observer.next(1);
    });
  }

  upload3p(param: any): Observable<number>{
    return new Observable<number>((observer) => {
      observer.next(1);
    });
  }

  submitQualifyingLeads(params:{}){
    let url = this.API_URI + '/QualifyLeads';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  submitUnqualifyingLeads(params:{}){
    let url = this.API_Main_URL + '/Leads/updateLeadQualificationStatus';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  reassignLeads(params:{}){
    let url = this.API_Main_URL + "/Leads/ReassignLeads";
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  getListOfUnqualifyingReasons(){
    let url = this.API_LeadsURI + '/getAllReturnReasons';
    return this.httpClient.get<IResponseLeadDetailsList>(url);
  }

  getCampaignDataByID(params: {}){
    let url = this.API_PXSegment_URI + '/getPXCampaignSegmentPairBySegmentId';
    return this.httpClient.post<IResponseLeadDetailsList>(url, params);
  }

  getMonthlyPacing(params:{}) {
    const url = this.API_PXSegment_URI + "/getMonthlyPacing"
    return this.httpClient.post<any>(url, params);
  }

  isValidForReaasign(params:{}) {
    const url = this.API_Main_URL + "/Leads/IsValidForReassignment";
    return this.httpClient.post<any>(url, params);
  }

  isValidForInternalReturn(params:{}) {
    const url = this.API_Main_URL + "/Leads/isValidForInternalReturn";
    return this.httpClient.post<any>(url, params);
  }

}

export const LeadeDeliveryStatusSamle: IWidgets[] = [
  { title: 'Delivery Schedule', headerColor: "#009688", widgetType: "infoStatus", data: 'deliverySchedule', text: 'Monday, Thursday', icon: "send" },
  { count: 56, title: 'Qualified Leads', backgroundColor: "#c6e4f5", headerColor: "#005586", widgetType: "infoStatus", data: 'qualifiedLeads' },
  { count: 24, title: 'Daily Limit', backgroundColor: "#ffe7c4", headerColor: "#ff9322", tooltipText: "Daily Limit", showHelpIcon: true, widgetType: "infoStatus", data: "dailyLimit" },
  { count: 212, title: 'Monthly Pacing', backgroundColor: "#ffe7c4", headerColor: "#ff9322", tooltipText: "Monthly Pacing", showHelpIcon: true, widgetType: "infoStatus", data: "MonthlyPacing" },
  { count: 4, title: 'Potential Duplicate', backgroundColor: "#ffe7c4", headerColor: "#ff9322", tooltipText: "Potential Duplicate", showHelpIcon: true, widgetType: "infoStatus", data: "PotentialDuplicate" }
]

