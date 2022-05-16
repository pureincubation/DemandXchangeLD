import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import { DSEPComponentService } from '../../../_shared/dsep-components/v0.2/_common/dsep-global-component';
import { LeadDeliveryColumns, LeadUserPersona, IWidgets, IResponseCampaignList, IResponseDeliverLeadsClient, SegmentSectionMainColumns } from '../_interfaces/lead-delivery.interface';
import { CampaignDueEnum, CampaignListType, DeliveryMethod, LeadDeliveryStatus, LeadDeliveryUserType } from '../_enums/lead-delivery.enum';
import { CampaignProgressTypes } from '../../dsep-toolset/_interfaces/campaignlist.interface';
import { GlobalsService } from '../../../_core/globals.service';
import { IRequestPagination, IResponseLeadFile, UserContextLeadDelivery } from '../_interfaces/lead-delivery-main.interface';
import { PortalAuthenticationService } from '../../../_services/dsep-portal-auth.service';
import { DsepFileUploadService } from '../../../_shared/dsep-components/v0.2/_model/file-uploader.service';
import { DateHelperService } from '../../../_shared/dsep-components/v0.2/_common/dsep-date-helper';
import { DatePipe } from '@angular/common';
@Injectable({
  providedIn: 'root'
})
export class LeadDeliveryService {
  userContext: UserContextLeadDelivery;

  API_MicroUrl = this.globalSvc.env.appConfig.leadDelivery.leadMicroUrl;
  API_LeadFiles = this.API_MicroUrl + '/leadFiles';
  API_URICampaign = this.globalSvc.env.appConfig.leadDelivery.mainUrl + '/PXCampaign';
  API_LeadDelivery = this.globalSvc.env.appConfig.leadDelivery.mainUrl + '/leadDelivery';
  API_NotifyCXM = this.globalSvc.env.appConfig.leadDelivery.mainUrl + '/leaddelivery';

  constructor(private _cmpGlobalSvc: DSEPComponentService,
            private httpClient: HttpClient,
            private globalSvc: GlobalsService,
            public uploaderService : DsepFileUploadService,
            private authSvc: PortalAuthenticationService,
            public datePipe: DatePipe,
            public dateHelper: DateHelperService) {}

  invokeLeadsAggregationProcess(params: {}){
    let url = this.globalSvc.env.apiEndPoint + '/leads/sendLeadsAggregationProcessor'
    return this.httpClient.post<any>(url, params);
  }
          

  getLoggonUserId(){
     return this.authSvc.loggedOnUser.id;
  }

  requestLeadFile(params:{}, endpoint: string){
    let url = this.API_LeadFiles + '/' + endpoint;
    return this.httpClient.post<IResponseLeadFile>(url, params);
  }

  leadsToClient(params:{}, endpoint: string){
    let url = this.API_LeadDelivery + '/' + endpoint;
    return this.httpClient.post<IResponseDeliverLeadsClient>(url, params);
  }

  leadsToNotify(params:{}, endpoint: string){
    let url = this.API_NotifyCXM + '/' + endpoint ;
    return this.httpClient.post<IResponseDeliverLeadsClient>(url, params);

  }

  isLoggedInUserMemberOf(userType: LeadDeliveryUserType){
      return this.authSvc.isUserMemberOf(LeadDeliveryUserType[LeadDeliveryUserType[userType]]);
  }

  loggedInUser(){
    return this.authSvc.loggedOnUser;
  }

  prepareDeliveryListColumns(x) {

    if(this._cmpGlobalSvc.isString(x.pxSegmentID)){

      x.pxSegmentID = {text: x.pxSegmentID, routePath: `/LeadsDelivery/leadDetails/${x.pxSegmentID}`}
     /* if(x.status === LeadDeliveryStatus['Approval Pending'] ||
      x.status === LeadDeliveryStatus.Completed ||
      x.status === LeadDeliveryStatus['In Progress']){
         x.campaignName = {text: x.campaignName, iconCmp: { icon:"open_in_new"} }
      }*/
    }

    x.leadPreparationDone = {value: x.leadPreparationDone? x.leadPreparationDone: 0};
    x.outstanding = x.outstanding? x.outstanding: 0;

   

    let lastDeliveryDate = x["lastDeliveryDate"];
    x["lastDeliveryDateModified"] = lastDeliveryDate;
    x["deliveryMethodText"] = {};
    if(x["deliveryMethod"] === 1){
      if(!x["autoPassEnabled"]){
        x["deliveryMethodText"] = {text: "Autopass (Paused)", color: "#ED4E4A"};
      }else{
        if(x["autoPassEnabled"]){
          x["deliveryMethodText"] = {text: "Autopass (Enabled)", color: "#4C9D50"} ;
        }else{
          x["deliveryMethodText"] =  {text: "Autopass" };
        }
      }

      if(lastDeliveryDate){
         let currentDate = this.dateHelper.convertDateToEST(new Date());
         lastDeliveryDate = new Date(lastDeliveryDate);
         
         let numDaysDiff = this.dateHelper.getNumOfDaysDiff(lastDeliveryDate, currentDate);
         x["lastDeliveryDateModified"] = { text: this.datePipe.transform(lastDeliveryDate, "MMM d, y h:mm:ss a"), color: '', weight: 100 };
         if(numDaysDiff > 7){
           x["lastDeliveryDateModified"].color = "red";
           x["lastDeliveryDateModified"].weight = 600;
         }
      }
  
    }
    else if(x["deliveryMethod"] === 3){
      if(!x["autoPassEnabled"]){
        x["deliveryMethodText"] = {text: "Autopass and Manual (Paused)", color: "#ED4E4A"};
      }else{
        if(x["autoPassEnabled"]){
          x["deliveryMethodText"] = {text: "Autopass and Manual (Enabled)", color: "#4C9D50"} ;
        }else{
          x["deliveryMethodText"] =  {text: "Autopass and Manual" };
        }
      }
      if(lastDeliveryDate){
        let currentDate = this.dateHelper.convertDateToEST(new Date());
        lastDeliveryDate = new Date(lastDeliveryDate);
        
        let numDaysDiff = this.dateHelper.getNumOfDaysDiff(lastDeliveryDate, currentDate);
        x["lastDeliveryDateModified"] = { text: this.datePipe.transform(lastDeliveryDate, "MMM d, y h:mm:ss a"), color: '', weight: 100 };
        if(numDaysDiff > 7){
          x["lastDeliveryDateModified"].color = "red";
          x["lastDeliveryDateModified"].weight = 600;
        }
      }
    }else{
      x["deliveryMethodText"] =   {text: DeliveryMethod[x["deliveryMethod"]]} ;
      if(lastDeliveryDate){
        x["lastDeliveryDateModified"] = { text: this.datePipe.transform(lastDeliveryDate, "MMM d, y h:mm:ss a")};
      }

    }
   
   

    if(!this._cmpGlobalSvc.isObject(x.status)){
      let obj = {value: x.status, clsColor: ''}
      if(x.status === LeadDeliveryStatus['To Do']){
        obj.clsColor = '';
      }
      if(x.status === LeadDeliveryStatus["In Progress"]){
        obj.clsColor = 'chip-color-blue';
      }

      if(x.status === LeadDeliveryStatus['Approval Pending']){
        obj.clsColor = 'chip-color-amber';
      }

      if(x.status === LeadDeliveryStatus.Completed){
        obj.clsColor = 'chip-color-green';
      }
      x.status = obj;
    }

    if(this._cmpGlobalSvc.isBoolean(x.isLock)){
       x.isLock = {checked: x.isLock, disabled: x.isLock};
    }

  if(x["lockUserFullName"] && String(x["lockUserFullName"]).indexOf('Locked') < 0){
    x["lockUserFullName"] =  `Locked to ${x["lockUserFullName"]}`;
  }

  if(!x["lfcUser"]){
      x["lfcUser"] = { tipText: "Unassigned" };
  }else{
    x["lfcUser"]["avatarText"] = x["lfcUser"]["fullName"];
  }

  if(!x["cxmUser"]){
    x["cxmUser"] = { tipText: "Unassigned" };
  }else{
    x["cxmUser"]["avatarText"] = x["cxmUser"]["fullName"];
  }
  if(!x["paUser"]){
    x["paUser"] = { tipText: "Unassigned" };
  }else{
    x["paUser"]["avatarText"] = x["paUser"]["fullName"];
  }
    /*if(x.users.length > 0){
        x.users.forEach(user => {
            if(user.userGroup && user.userGroup === LeadDeliveryUserType.LFC){
               x["userLFC"] = user;
            }
            if(user.userGroup && user.userGroup === LeadDeliveryUserType.CXM){
              x["userCXM"] = user;

            }
            if(user.userGroup && user.userGroup === LeadDeliveryUserType.PA){
              x["userPA"] = user;
            }
        });
    }*/

    return x;
  }

  onRequestDownload(params:{}): Observable<IResponseLeadFile>{
    return new Observable<IResponseLeadFile>((observer)=>{
       this.requestLeadFile(params, 'getleadfiledownloadlink').subscribe(respData => {
           observer.next(respData);
       });
    });
  }

  onRequestReplace(){

  }

  onRequestRegen(){

  }

  onRequestGenerate(params: {}): Observable<IResponseLeadFile>{
    return new Observable<IResponseLeadFile>((observer)=>{
       this.requestLeadFile(params, 'generateleadfile').subscribe(respData => {
           observer.next(respData);
       });
    });
  }

  onRequestGetFileStatus(params: {}): Observable<IResponseLeadFile>{
    return new Observable<IResponseLeadFile>((observer)=>{
       this.requestLeadFile(params, 'getleadfileStatus').subscribe(respData => {
           observer.next(respData);
       });
    });
  }

  deliverLeadsToClient(params: {}): Observable<IResponseDeliverLeadsClient>{
    return new Observable<IResponseDeliverLeadsClient>((observer)=>{
       this.leadsToClient(params, 'deliverleadstoclient').subscribe(respData => {
           observer.next(respData);
       });
    });
  }

  setcampaignDeliveryStatusToComplete(params: {}): Observable<IResponseDeliverLeadsClient>{
    return new Observable<IResponseDeliverLeadsClient>((observer)=>{
      this.leadsToClient(params, 'setcampaigndeliverystatustocomplete').subscribe(respData => {
          observer.next(respData);
      });
   });
  }

  notifyCXM(params: {}): Observable<IResponseDeliverLeadsClient>{
    return new Observable<IResponseDeliverLeadsClient>((observer)=>{
       this.leadsToNotify(params, 'notifycxm').subscribe(respData => {
           observer.next(respData);
       });
    });
  }

  getUsersLFCGroup(params: {}){
    let url = this.globalSvc.env.authUrl + '/membership/getusers'
    return this.httpClient.post<IResponseCampaignList>(url, params);
  }

  getUsersCXMGroup(params: {}){
    let url = this.globalSvc.env.authUrl + '/membership/getusers'
    return this.httpClient.post<IResponseCampaignList>(url, params);
  }

  getUsersPAGroup(params: {}){
    let url = this.globalSvc.env.authUrl + '/membership/getusers'
    return this.httpClient.post<IResponseCampaignList>(url, params);
  }

  getPXCampaignDue(params:{}){
    let url = this.API_URICampaign + '/getPXCampaignsCount'
    return this.httpClient.post<IResponseCampaignList>(url, params);
  }

  getCampaignListAPICall(params:{}){
    let url = this.API_URICampaign + '/getPXCampaigns'
    return this.httpClient.post<IResponseCampaignList>(url, params);
  }

  getPxSegementsByCID(params: {}): Observable<IResponseCampaignList[]>{
    let url = this.API_URICampaign + '/getPXSegments'
    return this.httpClient.post<IResponseCampaignList[]>(url, params);
  }

  preparePXCampaignCardColumn(dataList: any): any{
    dataList = dataList.map((x => {

      if(!x["lfcUser"]){
        x["lfcUser"] = { tipText: "Unassigned" };
      }

      if(!x["cxmUser"]){
        x["cxmUser"] = { tipText: "Unassigned" };
      }
      if(!x["paUser"]){
        x["paUser"] = { tipText: "Unassigned" };
      }

      if(!this._cmpGlobalSvc.isObject(x.deliveryStatus)){
        let obj = {value: x.deliveryStatus, color: 'grey'}
        if(x.deliveryStatus === 0){
          obj.value = 1;
        }

        if(x.deliveryStatus === CampaignListType['In Progress']){
          obj.color = 'blue';
        }

        if(x.deliveryStatus === CampaignListType.Error){
          obj.color = 'red';
        }

        if(x.deliveryStatus === CampaignListType['Sending Failed']){
          obj.color = 'deep-orange';
        }

        if(x.deliveryStatus === CampaignListType.Sending){
          obj.color = 'orange';
        }

        if(x.deliveryStatus === CampaignListType['Approval Pending']){
          obj.color = 'amber';
        }

        if(x.deliveryStatus === CampaignListType.Completed){
          obj.color = 'green';
        }
        x.deliveryStatus = obj;
      }

      x["pxCampaign"] = {
        content: x
      }
      return x;
    }).bind(this));

    return dataList;
  }

  filterCardTable(params: any): Observable<any[]> {
    return new Observable<any[]>((observer) => {
      this.getCampaignListAPICall(params).subscribe(objRes =>{
        let campaignList:IResponseCampaignList[] = objRes.data.items as IResponseCampaignList[];
        campaignList = this.preparePXCampaignCardColumn(campaignList);
        let dataObj:any = { data: campaignList, totalCount:  objRes.data.totalCount }
        observer.next(dataObj);
      });
    });
  }

  filterSegmentTable(params: any): Observable<any[]> {
    return new Observable<any[]>((observer)=>{
      this.getPxSegementsByCID(params).subscribe(objData => {
        let campaignList:IResponseCampaignList[] = objData["data"].items as IResponseCampaignList[];
        //let campaignList:any = LDSampleCampaigns.slice(params["skip"], params["take"]);
          campaignList = campaignList.map((x => {
            let col = this.prepareDeliveryListColumns(x);
            return col;

        }).bind(this));
        let dataObj:any = { data: campaignList, totalCount:  objData["data"].totalCount }
        observer.next(dataObj);
      });
  });
  }


  getPXCampaignAssignedToUser(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
      this.getCampaignListAPICall(params).subscribe(objRes =>{
        let campaignList:IResponseCampaignList[] = objRes.data.items as IResponseCampaignList[];
        campaignList = this.preparePXCampaignCardColumn(campaignList);
        let dataObj:any = { data: campaignList, totalCount:  objRes.data.totalCount }
        observer.next(dataObj);
      });
    });
  }

  getPXCampaignList(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
      this.getCampaignListAPICall(params).subscribe(objRes =>{
        let campaignList:IResponseCampaignList[] = objRes.data.items as IResponseCampaignList[];
        campaignList = this.preparePXCampaignCardColumn(campaignList);
        let dataObj:any = { data: campaignList, totalCount:  objRes.data.totalCount }
        observer.next(dataObj);
      });
    });
  }


  getSegmentDataByCampID(params: {}): Observable<any[]>{
      return new Observable<any[]>((observer)=>{
        this.getPxSegementsByCID(params).subscribe(objData => {
          let campaignList:IResponseCampaignList[] = objData["data"].items as IResponseCampaignList[];
          //let campaignList:any = LDSampleCampaigns.slice(params["skip"], params["take"]);
            campaignList = campaignList.map((x => {
              let col = this.prepareDeliveryListColumns(x);
              return col;

          }).bind(this));

          let dataObj:any = { data: campaignList, totalCount:  objData["data"].totalCount }

          observer.next(dataObj);
        });
    });
  }

  getLeadsDueForDelivery(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
        let campaignList:any = LeadDeliverSample.slice(params["skip"], params["take"]);
        campaignList = campaignList.map((x => {
          let col = this.prepareDeliveryListColumns(x);

          return col;

      }).bind(this));

      let dataObj:any = { data: campaignList }
      if(params["includeTotal"]){
         dataObj["totalCount"] =  30;
      }

      observer.next(dataObj);
    });
  }

  getLeadsSubmitted(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
        let campaignList:any = LeadDeliverSample.slice(params["skip"], params["take"]);
        campaignList = campaignList.map((x => {
          let col = this.prepareDeliveryListColumns(x);
          return col;

      }).bind(this));

      let dataObj:any = { data: campaignList }
      if(params["includeTotal"]){
         dataObj["totalCount"] =  30;
      }

      observer.next(dataObj);
    });
  }

  getLeadDeliveredList(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
        let list:any = LeadDeliverSample.slice(params["skip"], params["take"]);
        let campaignList = list.filter((data) => data.status.value === 4);
        campaignList = campaignList.map((x => {
          let col = this.prepareDeliveryListColumns(x);

          return col;

      }).bind(this));

      let dataObj:any = { data: campaignList }
      if(params["includeTotal"]){
         dataObj["totalCount"] =  30;
      }

      observer.next(dataObj);
    });
  }

  getLeadErrorsList(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
        let list:any = LeadDeliverSample.slice(params["skip"], params["take"]);
        let campaignList = list.filter((data) => data.status.value === 4);
        campaignList = campaignList.map((x => {
          let col = this.prepareDeliveryListColumns(x);

          return col;

      }).bind(this));

      let dataObj:any = { data: campaignList }
      if(params["includeTotal"]){
         dataObj["totalCount"] =  30;
      }

      observer.next(dataObj);
    });
  }

  getLeadRemainingList(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
        let campaignList:any = LeadDeliverSample.slice(params["skip"], params["take"]);
        campaignList = campaignList.filter((data) => data.status.value !== 4);
        campaignList = campaignList.map((x => {
          let col = this.prepareDeliveryListColumns(x);

          return col;

      }).bind(this));

      let dataObj:any = { data: campaignList }
      if(params["includeTotal"]){
         dataObj["totalCount"] =  30;
      }

      observer.next(dataObj);
    });
  }

  getLeadsStatusWidgets(params: {}): Observable<any[]>{
    return new Observable<any[]>((observer)=>{
     // let campaignList:any = LeadDeliverSample.slice(params["skip"], params["take"]);
     // let deliveredCount = campaignList.filter((data) => data.status.value === 4).length > 0? campaignList.filter((data) => data.status.value === 4).length : 0;
      //let remainingCount = campaignList.filter((data) => data.status.value !== 4).length;
    //  let totalCount = deliveredCount + remainingCount;
      let  widgetPagi: any = { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination;
      const widgetCardsStatus = [
        { text: String(0), subText: 'All Due Today', isSelected: true, layout:"standard", cls: 'alldue-widget', key: CampaignDueEnum.AllDue , color: '#3277cd', icon: "sticky_note_2", bcolor: "#dcebf8"},
        { text: String(0), subText: 'Status Widget', layout:"grid", color: '#b25226', icon: "fact_check", bcolor: "#fef9eb", items:[
          { text: String(0), subText: 'To Do', layout:"standard",cls: 'todo-widget',  key: CampaignDueEnum.ToDo , color: '#797979', bcolor: "#fff0d9"},
          { text: String(0), subText: 'In Progress', layout:"standard", cls: 'inprogress-widget', key: CampaignDueEnum.InProgress , color: '#2296F3', bcolor: "#fff0d9"},
          { text: String(0), subText: 'Approval Pending', layout:"standard", cls: 'approvalpending-widget', key: CampaignDueEnum.ApprovalPending , color: '#FFC009',  bcolor: "#fff0d9"},
          { text: String(0), subText: 'Sending Failed', layout:"standard", cls: 'sendingfailed-widget', key: CampaignDueEnum.SendingFailed , color: '#FF5622',  bcolor: "#fff0d9"},
          { text: String(0), subText: 'Autopass Error', layout:"standard", cls: 'autopasserror-widget', key: CampaignDueEnum.AutoPassError , color: '#ED4E4A',  bcolor: "#fff0d9"},
          { text: String(0), subText: 'Completed',layout:"standard", cls: 'completed-widget', key: CampaignDueEnum.Completed ,  color: '#95ba5f', bcolor: "#fff0d9"}
        ]},
        { text: String(0), subText: 'All Campaigns', layout:"standard", cls: 'allactive-widget', key: CampaignDueEnum.All , color: "#8166b2", icon: "sticky_note_2", bcolor: "#e6e6f3", },
        { text: String(0), subText: 'Autopass Testing', layout:"standard", cls: 'autopasstesting-widget', key: CampaignDueEnum.AutoPassTesting , color: "#ff9933", icon: "input_black_24dp", bcolor: "#fff0d9", }
      ]

      const deliveryInfoWidgets = [
        { count: 0, name: 'All Due Today', key: CampaignDueEnum.AllDue , color: '#3277cd', icon: "sticky_note_2", bcolor: "#dcebf8"},
        { count: 0, name: 'Remaining Today', key: CampaignDueEnum.Remaining , color: '#b25226', icon: "fact_check", bcolor: "#fef9eb"},
        { count: 0, name: 'Completed Today', key: CampaignDueEnum.Completed ,  color: '#95ba5f', icon: "done_all", bcolor: "#f4f8ee"},
        { count: 0, name: 'All Campaigns', key: CampaignDueEnum.All , color: "#8166b2", icon: "sticky_note_2", bcolor: "#e6e6f3", },
        { count: 0, name: 'Autopass Testing', key: CampaignDueEnum.AutoPassTesting , color: "#ff9933", icon: "input_black_24dp", bcolor: "#fff0d9", }
      ];

      this.getPXCampaignDue({pagination: widgetPagi, "CampaignDue": CampaignDueEnum.All }).subscribe(objList => {
        widgetCardsStatus[2]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({pagination: widgetPagi, "CampaignDue": CampaignDueEnum.AllDue}).subscribe(objList => {
        widgetCardsStatus[0]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue": CampaignDueEnum.ToDo}).subscribe(objList => {
        widgetCardsStatus[1]["items"][0]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.InProgress}).subscribe(objList => {
        widgetCardsStatus[1]["items"][1]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.ApprovalPending}).subscribe(objList => {
        widgetCardsStatus[1]["items"][2]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.SendingFailed}).subscribe(objList => {
        widgetCardsStatus[1]["items"][3]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.AutoPassError}).subscribe(objList => {
        widgetCardsStatus[1]["items"][4]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.Completed}).subscribe(objList => {
        widgetCardsStatus[1]["items"][5]["text"] = String(objList.data.count);
      });

      this.getPXCampaignDue({ pagination: widgetPagi, "CampaignDue":  CampaignDueEnum.AutoPassTesting}).subscribe(objList => {
        widgetCardsStatus[3]["text"] = String(objList.data.count);
      });


      let dataObj:any = { data: {widgetCardsStatus: widgetCardsStatus} }
      observer.next(dataObj);
    });
  }

}

export const LeadDeliveryPXCampaign: SegmentSectionMainColumns[] = [
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20964",
    adminCID: 20964,
    segmentName: 'Carat MSFT ABM Q319 Connected Field Service Brazil',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20974",
    adminCID: 20974,
    segmentName: 'Bulldog Frontier Communications Q1 2018',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},

    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 2,

    pxCampaignID: "PXC-56443",
    adminCID: 20971,
    segmentName: 'Carbon Black ABM Jan-March 2018 Security-US Central',

    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 4,
    pxCampaignID: "PXC-67890",
    adminCID: 20963,
    segmentName: 'Dataiku ABM Jan18 - Secondary Persona',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20964",
    adminCID: 20964,
    segmentName: 'Carat MSFT ABM Q319 Connected Field Service Brazil',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 5,
    pxCampaignID: "PXC-12345",
    adminCID: 20974,
    segmentName: 'Bulldog Frontier Communications Q1 2018',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 2,
    pxCampaignID: "PXC-56443",
    adminCID: 20971,
    segmentName: 'Carbon Black ABM Jan-March 2018 Security-US Central',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 4,
    pxCampaignID: "PXC-67890",
    adminCID: 20963,
    segmentName: 'Dataiku ABM Jan18 - Secondary Persona',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20964",
    adminCID: 20964,
    segmentName: 'Carat MSFT ABM Q319 Connected Field Service Brazil',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 1,
    pxCampaignID: "PXC-12345",
    adminCID: 20974,
    segmentName: 'Bulldog Frontier Communications Q1 2018',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 2,
    pxCampaignID: "PXC-56443",
    adminCID: 20971,
    segmentName: 'Carbon Black ABM Jan-March 2018 Security-US Central',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 4,
    pxCampaignID: "PXC-67890",
    adminCID: 20963,
    segmentName: 'Dataiku ABM Jan18 - Secondary Persona',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20964",
    adminCID: 20964,
    segmentName: 'Carat MSFT ABM Q319 Connected Field Service Brazil',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 1,
    pxCampaignID: "PXC-12345",
    adminCID: 20974,
    segmentName: 'Bulldog Frontier Communications Q1 2018',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 2,
    pxCampaignID: "PXC-56443",
    adminCID: 20971,
    segmentName: 'Carbon Black ABM Jan-March 2018 Security-US Central',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 4,
    pxCampaignID: "PXC-67890",
    adminCID: 20963,
    segmentName: 'Dataiku ABM Jan18 - Secondary Persona',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-20964",
    adminCID: 20964,
    segmentName: 'Carat MSFT ABM Q319 Connected Field Service Brazil',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 1,
    pxCampaignID: "PXC-12345",
    adminCID: 20974,
    segmentName: 'Bulldog Frontier Communications Q1 2018',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},

    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 2,
    pxCampaignID: "PXC-56443",
    adminCID: 20971,
    segmentName: 'Carbon Black ABM Jan-March 2018 Security-US Central',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 4,
    pxCampaignID: "PXC-67890",
    adminCID: 20963,
    segmentName: 'Dataiku ABM Jan18 - Secondary Persona',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    dueDate: new Date("1/31/2020")
  },
  {
    id: 1,
    status: 3,
    pxCampaignID: "PXC-22669",
    adminCID: 22669,
    segmentName: 'Test Campaign 22669',
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    dueDate: new Date("1/31/2020")
  },
  // {
  //   id: 1,
  //   status: 1,
  //   pxCampaignID: "PXC-12345",
  //   adminCID: 20974,
  //   campaignName: 'Bulldog Frontier Communications Q1 2018',
  //   userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
  //   userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
  //   userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},

  //   dueDate: new Date("1/31/2020")
  // },
  // {
  //   id: 1,
  //   status: 2,
  //   pxCampaignID: "PXC-56443",
  //   adminCID: 20971,
  //   campaignName: 'Carbon Black ABM Jan-March 2018 Security-US Central',
  //   userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
  //   userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
  //   userPA: undefined,
  //   dueDate: new Date("1/31/2020")
  // },
  // {
  //   id: 1,
  //   status: 4,
  //   pxCampaignID: "PXC-67890",
  //   adminCID: 20963,
  //   campaignName: 'Dataiku ABM Jan18 - Secondary Persona',
  //   userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
  //   userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
  //   userPA:  {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
  //   dueDate: new Date("1/31/2020")
  // },
]


export const LeadDeliverSample: LeadDeliveryColumns[] = [
    {id: 1, cid: 501, campaignName: "Test COMPANY TEST NO# 1", deliveryMethod: 1, leadsToDeliver: 100, leadsDelivered: 200, deliverDateTime: new Date("01/25/2020"), status: 5, isLock: true, lockUserFullName: "ma ta", users: [{id: 1, firstName: "ma", lastName: "ta", avatarText: 'ma ta', avatarImagePath: 'assets/images/luffy2.png', userGroup: 1} as LeadUserPersona] },
    {id: 2, cid: 502, campaignName: "Test COMPANY TEST NO# 2", deliveryMethod: 2, leadsToDeliver: 120,  deliverDateTime: new Date("02/15/2020"), status: 5, isLock: true,lockUserFullName: "me te", users: [{id: 2, firstName: "me", lastName: "te", avatarText: 'me te', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 3, cid: 503, campaignName: "Test COMPANY TEST NO# 3", deliveryMethod: 1, leadsToDeliver: 132,  deliverDateTime: new Date("04/25/2020"), status: 6, isLock: false, users: []},
    {id: 4, cid: 504, campaignName: "Test COMPANY TEST NO# 4", deliveryMethod: 2, leadsToDeliver: 234,  deliverDateTime: new Date("08/5/2020"), status: 1, isLock: true, lockUserFullName: "mi ti", users: [{id: 10, firstName: "mi", lastName: "ti", avatarText: 'mi ti', avatarImagePath: '', userGroup: 1} as LeadUserPersona, {id: 31, firstName: "ca", lastName: "ba", avatarText: 'ca ba', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 5, cid: 505, campaignName: "Test COMPANY TEST NO# 5", deliveryMethod: 1, leadsToDeliver: 543,  deliverDateTime: new Date("03/8/2020"), status: 2, isLock: true, lockUserFullName: "mo to", users: [{id: 4, firstName: "mo", lastName: "to", avatarText: 'mo to', avatarImagePath: '', userGroup: 1} as LeadUserPersona, {id: 32, firstName: "ce", lastName: "be", avatarText: 'ce be', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 6, cid: 506, campaignName: "Test COMPANY TEST NO# 6", deliveryMethod: 2, leadsToDeliver: 453, leadsDelivered: 114, deliverDateTime: new Date("09/05/2020"), status: 4, isLock: true, users: [{id: 10, firstName: "mu", lastName: "tu", avatarText: 'mu tu', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 7, cid: 507, campaignName: "Test COMPANY TEST NO# 7", deliveryMethod: 1, leadsToDeliver: 867, leadsDelivered: 514, deliverDateTime: new Date("12/05/2020"), status: 2, isLock: true, users: [{id: 6, firstName: "ga", lastName: "ra", avatarText: 'ga ra', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 8, cid: 508, campaignName: "Test COMPANY TEST NO# 8", deliveryMethod: 2, leadsToDeliver: 326, leadsDelivered: 614, deliverDateTime: new Date("01/05/2020"), status: 6, isLock: false, users: []},
    {id: 9, cid: 509, campaignName: "Test COMPANY TEST NO# 9", deliveryMethod: 1, leadsToDeliver: 342, leadsDelivered: 814,  status: 4, isLock: true, users: [{id: 7, firstName: "ge", lastName: "re", avatarText: 'ge re', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 33, firstName: "ci", lastName: "bi", avatarText: 'ci bi', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 10, cid: 510, campaignName: "Test COMPANY TEST NO# 10", deliveryMethod: 2, leadsToDeliver: 1000, leadsDelivered: 1214, deliverDateTime: new Date("06/04/2020"), status: 4, isLock: true, users: [{id: 8, firstName: "gi", lastName: "ri", avatarText: 'gi ri', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 34, firstName: "co", lastName: "bo", avatarText: 'co bo', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 11, cid: 511, campaignName: "Test COMPANY TEST NO# 11", deliveryMethod: 1, leadsToDeliver: 254, leadsDelivered: 314, deliverDateTime: new Date("07/11/2020"), status: 5, isLock: true, users: [{id: 9, firstName: "go", lastName: "ro", avatarText: 'go ro', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 12, cid: 512, campaignName: "Test COMPANY TEST NO# 12", deliveryMethod: 2, leadsToDeliver: 653, leadsDelivered: 714, deliverDateTime: new Date("04/17/2020"), status: 5, isLock: true, users: [{id: 10, firstName: "gu", lastName: "ru", avatarText: 'gu ru', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 13, cid: 513, campaignName: "Test COMPANY TEST NO# 13", deliveryMethod: 1, leadsToDeliver: 809, leadsDelivered: 214,  status: 6, isLock: false, users: []},
    {id: 14, cid: 514, campaignName: "Test COMPANY TEST NO# 14", deliveryMethod: 2, leadsToDeliver: 342, leadsDelivered: 234, deliverDateTime: new Date("05/18/2020"), status: 3, isLock: true, users: [{id: 11, firstName: "ka", lastName: "na", avatarText: 'ka nu', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 45, firstName: "cu", lastName: "bu", avatarText: 'cu bu', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 15, cid: 515, campaignName: "Test COMPANY TEST NO# 15", deliveryMethod: 1, leadsToDeliver: 123, leadsDelivered: 2314, deliverDateTime: new Date("02/25/2020"), status: 3, isLock: true, users: [{id: 10, firstName: "ke", lastName: "ne", avatarText: 'ke ne', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 31, firstName: "wa", lastName: "ja", avatarText: 'wa ja', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 16, cid: 516, campaignName: "Test COMPANY TEST NO# 16", deliveryMethod: 2, leadsToDeliver: 324, leadsDelivered: 2144, deliverDateTime: new Date("03/23/2020"), status: 4, isLock: true, users: [{id: 13, firstName: "ki", lastName: "ni", avatarText: 'ki ni', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 17, cid: 517, campaignName: "Test COMPANY TEST NO# 17", deliveryMethod: 1, leadsToDeliver: 456, leadsDelivered: 2164,  status: 4, isLock: true, users: [{id: 14, firstName: "ko", lastName: "no", avatarText: 'ko no', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 18, cid: 518, campaignName: "Test COMPANY TEST NO# 18", deliveryMethod: 2, leadsToDeliver: 78, leadsDelivered: 74, deliverDateTime: new Date("04/18/2020"), status: 6, isLock: false, users: []},
    {id: 19, cid: 519, campaignName: "Test COMPANY TEST NO# 19", deliveryMethod: 1, leadsToDeliver: 71, leadsDelivered: 219, deliverDateTime: new Date("06/15/2020"), status: 4, isLock: true, users: [{id: 15, firstName: "ku", lastName: "nu", avatarText: 'ku nu', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 47, firstName: "we", lastName: "je", avatarText: 'we je', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 20, cid: 520, campaignName: "Test COMPANY TEST NO# 20", deliveryMethod: 2, leadsToDeliver: 61, leadsDelivered: 314, deliverDateTime: new Date("06/10/2020"), status: 4, isLock: true, users: [{id: 16, firstName: "pa", lastName: "la", avatarText: 'pa la', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 48, firstName: "wi", lastName: "ji", avatarText: 'wi ji', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 21, cid: 521, campaignName: "Test COMPANY TEST NO# 21", deliveryMethod: 1, leadsToDeliver: 401, leadsDelivered: 714, deliverDateTime: new Date("06/21/2020"), status: 5, isLock: true, users: [{id: 17, firstName: "pe", lastName: "le", avatarText: 'pe le', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 22, cid: 522, campaignName: "Test COMPANY TEST NO# 22", deliveryMethod: 2, leadsToDeliver: 201, leadsDelivered: 514, deliverDateTime: new Date("07/20/2020"), status: 5, isLock: true, users: [{id: 18, firstName: "pi", lastName: "li", avatarText: 'pi li', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 23, cid: 523, campaignName: "Test COMPANY TEST NO# 23", deliveryMethod: 1, leadsToDeliver: 101, leadsDelivered: 784, deliverDateTime: new Date("08/25/2020"), status: 6, isLock: false, users: []},
    {id: 24, cid: 524, campaignName: "Test COMPANY TEST NO# 24", deliveryMethod: 2, leadsToDeliver: 543, leadsDelivered: 84, deliverDateTime: new Date("04/05/2020"), status: 1, isLock: true, users: [{id: 19, firstName: "po", lastName: "lo", avatarText: 'po l o', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 49, firstName: "wo", lastName: "jo", avatarText: 'wo jo', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 25, cid: 525, campaignName: "Test COMPANY TEST NO# 25", deliveryMethod: 1, leadsToDeliver: 567, leadsDelivered: 234, deliverDateTime: new Date("02/05/2020"), status: 1, isLock: true, users: [{id: 20, firstName: "pu", lastName: "lu", avatarText: 'pu lu', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 50, firstName: "wu", lastName: "ju", avatarText: 'wu ju', avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 26, cid: 526, campaignName: "Test COMPANY TEST NO# 26", deliveryMethod: 2, leadsToDeliver: 345, leadsDelivered: 214, deliverDateTime: new Date("02/08/2020"), status: 4, isLock: true, users: [{id: 21, firstName: "ha", lastName: "da", avatarText: 'ha da', avatarImagePath: '', userGroup: 1} as LeadUserPersona] },
    {id: 27, cid: 527, campaignName: "Test COMPANY TEST NO# 27", deliveryMethod: 1, leadsToDeliver: 562, leadsDelivered: 36, deliverDateTime: new Date("05/04/2020"), status: 4, isLock: true, users: [{id: 22, firstName: "he", lastName: "de", avatarText: 'he de', avatarImagePath: '', userGroup: 1} as LeadUserPersona]},
    {id: 28, cid: 528, campaignName: "Test COMPANY TEST NO# 28", deliveryMethod: 2, leadsToDeliver: 980, leadsDelivered: 14, deliverDateTime: new Date("12/12/2020"), status: 6, isLock: false, users: []},
    {id: 29, cid: 529, campaignName: "Test COMPANY TEST NO# 28", deliveryMethod: 1, leadsToDeliver: 34, leadsDelivered: 7, deliverDateTime: new Date("11/06/2020"), status: 2, isLock: true, users: [{id: 23, firstName: "hi", lastName: "di", avatarText: 'hi di', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 51, firstName: "chris", lastName: "tups", avatarText: 'chris tups',  avatarImagePath: '', userGroup: 2} as LeadUserPersona] },
    {id: 30, cid: 530, campaignName: "Test COMPANY TEST NO# 30", deliveryMethod: 2, leadsToDeliver: 50, leadsDelivered: 84, deliverDateTime: new Date("11/05/2020"), status: 2, isLock: true, users: [{id: 24, firstName: "ho", lastName: "do", avatarText: 'ho do', avatarImagePath: '', userGroup: 1} as LeadUserPersona,  {id: 52, firstName: "mat", lastName: "tups", avatarText: 'mat tups', avatarImagePath: '', userGroup: 2} as LeadUserPersona]}
]

export const LDSampleCampaigns: SegmentSectionMainColumns[] = [
  {
    id: 1,isLock: false,
    status: 4,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-12345",
    adminCID: 20964,
    segmentName: "Carat MSFT ABM Q319 Connected Field Service Brazil",

    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: undefined,
    userCXM: undefined,
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 230,
    deliverySchedule: "Monday, Wednesday, Friday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined
  },
  {
    id: 2, isLock: false,
    status: 4,
    pxCampaignID: "PXC-12345",
    pxSegmentID: "PXS-12347",
    adminCID: 20974,
    segmentName: "Carbon Black ABM Jan-March 2018 Security-US Central",
    userLFC: undefined,
    userCXM: undefined,
    userPA: {id: 1, firstName: "Jack", lastName: "Daniels", avatarImagePath: '',  avatarText: 'Jack Daniels', userGroup: 3},
    notYetDeliver: 2,
    leadsdeliveryQueue: 640,
    deliverySchedule: "Monday, Friday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
  },
  {
    id: 3, isLock: false,
    status: 4,
    pxCampaignID: "PXC-12345",
    pxSegmentID: "PXS-15347",
    adminCID: 20973,
    segmentName: "Adobe Stock ABM Jan 18- Secondary Persona",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: undefined,
    userCXM: undefined,
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 125,
    deliverySchedule: "Monday, Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: undefined,
  },
  {
    id: 4,
    isLock: true,
    status: 3,
    pxCampaignID: "PXC-12345",
    pxSegmentID: "PXS-15367",
    adminCID: 20972,
    segmentName: "Bulldog Frontier Communications Q1 2018",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '', avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    notYetDeliver: 3,
    leadsdeliveryQueue: 425,
    deliverySchedule: "Monday, Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Julien Danivies",

  },
  {
    id: 5,isLock: true,
    status: 1,
    pxCampaignID: "PXC-56443",
    pxSegmentID: "PXS-15369",
    adminCID: 20971,
    segmentName: "Dataiku ABM Jan'18 - Secondary Persona",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 54, firstName: "Khan", lastName: "Harper", avatarImagePath: '',  avatarText: 'Khan Harper', userGroup: 1},
    userCXM: undefined,
    userPA: undefined,
    notYetDeliver: 3,
    leadsdeliveryQueue: 235,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Khan Harper",

  },
  {
    id: 6,
    isLock: true,
    status: 2,
    pxCampaignID: "PXC-56443",
    pxSegmentID: "PXS-15869",
    adminCID:20970,
    segmentName: "NetHawk Ring Central Jan Q1 2018 WP",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 2},
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 640,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 322,
    deliverDateTime: new Date("4/9/2021"),
    lockUserFullName: "Peppa Pig",

  },
  {
    id: 7,isLock: false,
    status: 4,
    pxCampaignID: "PXC-56443",
    pxSegmentID: "PXS-18879",
    adminCID: 20969,
    segmentName: "Carat MSFT ABM Q319 Connected Field Service Brazil",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: undefined,
    userCXM: undefined,
    userPA: {id: 34, firstName: "Randy", lastName: "Bograt", avatarImagePath: '',  avatarText: 'Randy Bograt', userGroup: 3},
    notYetDeliver: 1,
    leadsdeliveryQueue: 230,
    deliverySchedule: "Monday, Wednesday, Friday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
  },
  {
    id: 8, isLock: true,
    status: 1,
    pxCampaignID: "PXC-56443",
    pxSegmentID: "PXS-16734",
    adminCID: 20968,
    segmentName: "Carbon Black ABM Jan-March 2018 Security-US Central",
    userLFC:  {id: 90, firstName: "Junel", lastName: "Ganggang", avatarImagePath: '',  avatarText: 'Junel Ganggang', userGroup: 1},
    userCXM: undefined,
    userPA: undefined,
    notYetDeliver: 2,
    leadsdeliveryQueue: 640,
    deliverySchedule: "Monday, Friday",
    leadsdeliveredtoday: 279,
    deliverDateTime: new Date("8/15/2021"),
    lockUserFullName: "Junel Ganggang"
  },
  {
    id: 9, isLock: true,
    status: 3,
    pxCampaignID: "PXC-56443",
    pxSegmentID: "PXS-26734",
    adminCID: 20967,
    segmentName: "Adobe Stock ABM Jan 18- Secondary Persona",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 23, firstName: "Mathew", lastName: "Christian", avatarImagePath: '',  avatarText: 'Mathew Christian', userGroup: 1},
    userCXM: {id: 43, firstName: "Bonbon", lastName: "Daty", avatarImagePath: '',  avatarText: 'Bonbon Daty', userGroup: 2},
    userPA: {id: 56, firstName: "Arvin", lastName: "Caton", avatarImagePath: '',  avatarText: 'Arvin Caton', userGroup: 3},
    notYetDeliver: 1,
    leadsdeliveryQueue: 125,
    deliverySchedule: "Monday, Wednesday",
    leadsdeliveredtoday: 200,
    deliverDateTime: new Date("1/23/2021"),
    lockUserFullName: "Mathew Christian",
  },
  {
    id: 10,isLock: true,
    status: 3,
    pxCampaignID: "PXC-67890",
    pxSegmentID: "PXS-26314",
    adminCID: 20963,
    segmentName: "Bulldog Frontier Communications Q1 2018",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 34, firstName: "Julien", lastName: "Danivies", avatarImagePath: '',  avatarText: 'Julien Danivies', userGroup: 1},
    userCXM: {id: 65, firstName: "Jhon", lastName: "Cour", avatarImagePath: '',  avatarText: 'Jhon COur', userGroup: 2},
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 425,
    deliverySchedule: "Monday, Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Julien Danivies"
  },
  {
    id: 11,isLock: true,
    status: 1,
    pxCampaignID: "PXC-67890",
    pxSegmentID: "PXS-26341",
    adminCID: 20966,
    segmentName: "Dataiku ABM Jan'18 - Secondary Persona",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 54, firstName: "Khan", lastName: "Harper", avatarImagePath: '',  avatarText: 'Khan Harper', userGroup: 1},
    userCXM: undefined,
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 235,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Khan Harper"
  },
  {
    id: 12,isLock: true,
    status: 2,
    pxCampaignID: "PXC-67890",
    pxSegmentID: "PXS-23451",
    adminCID: 20965,
    segmentName: "NetHawk Ring Central Jan Q1 2018 WP",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 640,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 200,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 13,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 22544,
    segmentName: "22544-Test Campaign CYT-931",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 2,
    leadsdeliveryQueue: 125,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 14,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 20835,
    segmentName: "20835- Test Campaign AD-1739",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 1,
    leadsdeliveryQueue: 250,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 15,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 22139,
    segmentName: "22139- Google PSA 2021April-July NewLogos Telco",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 3,
    leadsdeliveryQueue: 750,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 16,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 22631,
    segmentName: "Test Campaign 001a",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 2,
    leadsdeliveryQueue: 22,
    deliverySchedule: "Wednesday",
    leadsdeliveredtoday: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 17,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 22669,
    segmentName: "Test Campaign 22669",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    notYetDeliver: 2,
    leadsdeliveredtoday: 24,
    deliverySchedule: "Wednesday",
    leadsdeliveryQueue: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
  {
    id: 18,isLock: true,
    status: 2,
    pxCampaignID: "PXC-14364",
    pxSegmentID: "PXS-23451",
    adminCID: 3990,
    segmentName: "Test TM Uber Prod",
    //userLFC: {id: 1, firstName: "ma", lastName: "ta", avatarImagePath: 'assets/images/luffy2.png', userGroup: 1},
    userLFC: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userCXM: {id: 55, firstName: "Peppa", lastName: "Pig", avatarImagePath: '',  avatarText: 'Peppa Pig', userGroup: 1},
    userPA: undefined,
    leadsdeliveredtoday: 2,
    leadsdeliveryQueue: 26,
    deliverySchedule: "Wednesday",
    notYetDeliver: 0,
    deliverDateTime: undefined,
    lockUserFullName: "Peppa Pig"
  },
 ]
