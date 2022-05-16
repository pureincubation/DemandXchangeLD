import {Component, Input, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DataSourceModel } from '../../../_shared/dsep-components/v0.2/_model/dsep-datasource.model';
import { CampaignDueEnum, CampaignListType, CampaignSchedule, DeliveryMethod, LeadDeliveryStatus, LeadDeliveryUserType, leadFileColor, LeadFileStatus, LeadPreparationDoneEnum } from '../_enums/lead-delivery.enum';
import { LeadDeliveryService } from '../_services/lead-delivery.service';
import { CampaignColumnIds, UserContext, IRequestDeliverLeadsClient, IRequestNotifyLeadsClient } from '../_interfaces/lead-delivery.interface';
import { DsepFileUploadService } from '../../../_shared/dsep-components/v0.2/_model/file-uploader.service';
import { analyzeAndValidateNgModules } from '@angular/compiler';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { DSEPComponentService } from '../../../_shared/dsep-components/v0.2/_common/dsep-global-component';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FormSourceModel } from '../../../_shared/dsep-components/v0.2/_model/dsep-form-source.model';
import { DialogWindowServiceComponent } from '../../../_shared/dsep-components/v0.2/panel/dialog-window/dsep-dialog-window.component';
import { DSEPFormComponent } from '../../../_shared/dsep-components/v0.2/form/dsep-form.component';
import { DsepFieldBaseComponent } from '../../../_shared/dsep-components/v0.2/form/fields/dsep-basefield/dsep-base-field.component';
import { filterFieldsMapping, filterQueryCriteria } from '../../../_shared/dsep-components/v0.2/_interfaces/dsep-filter-criteria.interface';
import { IRequestPagination } from '../_interfaces/lead-delivery-main.interface';
import { NotificationsService } from '../../../notifications/notifications.service';

import { GridComponent } from '../../../_shared/dsep-components/v0.2/grid/dsep-grid.component';
import { DSEPToastService } from  '../../../_shared/dsep-components/v0.2/notification/dsep-toast/dsep-toast.service';
import { of } from 'rxjs';
import { switchMap, distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'lead-delivery-main',
  templateUrl: `./lead-delivery.component.html`,
  styleUrls: [`./lead-delivery.component.scss`]
})
export class LeadDeliveryMainComponent implements OnInit {

    ldPXSegmentDataSource: DataSourceModel;
    ldCampaignPXDataSource: DataSourceModel;
    statusEnum: any = LeadDeliveryStatus;
    campaignStatus: any = CampaignListType;
    campaignSchedule: any = CampaignSchedule;
    deliveryMethodEnum: any = DeliveryMethod;
    deliveryMethod:number;
    leadPrepDoneEnum: any = LeadPreparationDoneEnum;
    deliveryStatusWidgets: any;
    userContex: UserContext;
    currentSelected: any;
    filterFormGroup: FormGroup;
    campaignTotalCount: number = 0;
    isCXMUser:boolean = false;
    isLFCUser:boolean = false;
    isPAUser:boolean = false;
    hasManual3P: boolean = false;
    cxmModalFormSource: FormSourceModel;
    currentCampainDue: CampaignDueEnum;
    fileMessage: string = "No lead file generated";
    dateTimeString: string = '';
    showRegenerateLink: boolean = false;
    disableDonwloadLink: boolean = true;
    disableReplaceLink: boolean = true;
    disableRegenLink: boolean = false;
    disableGenLink: boolean = false;
    pxCmapaignID: string = "";
    cxmDeliveryDialog: DialogWindowServiceComponent;
    customFilterFields: any[] = [];
    campaignCardListParam: any = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination, CampaignDue: CampaignDueEnum.AllDue };
    segmentParams: any = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination, pxCampaignID: this.pxCmapaignID };
    selectedWidgetInit: any;
    extensions: string[] = ['.xlsx' ,'.xls','.json','.doc','.docx', '.csv'];
    uploadUrl: string = this.leadService.API_LeadFiles + '/replaceleadsfile';
    @ViewChild("cxmDeliveryDialog")
    @ViewChild("lfcConfirmDialog") lfcDialog: DialogWindowServiceComponent;
    @ViewChild("cxmForm") cxmConfirmModalForm: DSEPFormComponent;
    @ViewChild("cxmField") cxmFieldSource: DsepFieldBaseComponent;
    @ViewChild("leaddeliverycampaignCard") currentGrid: GridComponent;
    @ViewChild("ldsegmentgrid") currentSegmentGrid: GridComponent;
    showLFCDeliveryButton:boolean = false;
    showCXMDeliveryButton:boolean = false;
    showPADeliveryButton:boolean = false;
    disabledCampCardFilterButton: boolean = false;
    uploadDialogHeaderText = "Notify CXM";
    uploadDialogDescriptionText = "Send notification to CXM for final review of leads.";
    deliverLeadsBtnDisable = false;
    showSegmentLoader = false;
    showCampaignLoader = true;
    leadFileTextColor = 'gray';
    deliverBtnToolTip = 'DELIVER LEADS TO CLIENT';
    constructor(private leadService: LeadDeliveryService,
                private route: Router,
                private _toasSvc: DSEPToastService,
                private actRoute: ActivatedRoute,
                public uploaderService : DsepFileUploadService,
                public notifSvc: NotificationsService,
                private _dsepSvc: DSEPComponentService){}
    ngOnInit() {
      let progressbarIdLoadLDMain =  this.notifSvc.setPageBusy(true);
      let objDirectData = this.actRoute.snapshot.data.directData;
 

      this.isCXMUser = this.leadService.isLoggedInUserMemberOf(LeadDeliveryUserType.CXM);
      this.isLFCUser = this.leadService.isLoggedInUserMemberOf(LeadDeliveryUserType.LFC);
      this.isPAUser = this.leadService.isLoggedInUserMemberOf(LeadDeliveryUserType.PA);

      this.filterFormGroup = new FormBuilder().group({});
      this.filterFormGroup.addControl( 'assignedToMeBar', new FormControl());
      this.filterFormGroup.get("assignedToMeBar").valueChanges.subscribe((val => {
        let searchValue = this._dsepSvc.getComponent("seach-camp-card").dsepFormGroup.get("quickSearchCampaignID").value;
        let campaignAllDueKey = CampaignDueEnum.AllDue;
        this.deliveryStatusWidgets.data = this.deliveryStatusWidgets.data.map(ele => {
          if(val && ele.key !== campaignAllDueKey) {
            return {...ele,isDisable:true }
          }
          return {...ele,isDisable:false }
        });
        if(val){
          // this.selectedWidgetInit.isDisable = this.selectedWidgetInit.key !==2 ? true : false;
          this.selectedWidgetInit = this.deliveryStatusWidgets.data.find(ele => ele.key === campaignAllDueKey);
          this.selectedWidgetInit.isDisable=true;
          this.disabledCampCardFilterButton = true;
          this.currentCampainDue = campaignAllDueKey;
          this.campaignCardListParam.CampaignDue = campaignAllDueKey;
          this.campaignCardListParam.pagination = { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination;
          this.ldCampaignPXDataSource.params = this.campaignCardListParam;
          if(this.filterFormGroup.get("isAssignedToMe")){
            this.filterFormGroup.get("isAssignedToMe").disable();
          }

          this.disabledStatusFilterControl(this.filterFormGroup);
          this.disabledScheduleFilterControl(this.filterFormGroup);
          this.onFilterSegmentAssignedToMe();

          if(searchValue && searchValue.length > 5) {
            this.onSearchCardEmitter(searchValue);
          }

        }else{
          if(this.filterFormGroup.get("isAssignedToMe")){
            this.filterFormGroup.get("isAssignedToMe").enable();
          }

          this.selectedWidgetInit.isDisable = false;
          delete this.ldCampaignPXDataSource["filterObjectCriteria"];
          this.enableStatusFilterControl(this.filterFormGroup);
          this.disabledScheduleFilterControl(this.filterFormGroup);
          this.disabledCampCardFilterButton = false;

          if(searchValue && searchValue.length > 5) {
            this.onSearchCardEmitter(searchValue);
          }else{
            this.ldCampaignPXDataSource.loadData();
          }
        }

      }).bind(this));


      this.currentCampainDue = CampaignDueEnum.AllDue;
      this.ldCampaignPXDataSource = new DataSourceModel(this.leadService);
      this.ldCampaignPXDataSource.params = this.campaignCardListParam;
      this.ldCampaignPXDataSource.isProxy = true;
      this.ldCampaignPXDataSource.isAutoLoad = false;
      this.ldCampaignPXDataSource.method = "getPXCampaignList";
      this.ldCampaignPXDataSource.filterMethod = "filterCardTable";
      this.ldCampaignPXDataSource.onSuccessCallBack.subscribe((objData => {
        if(objData && objData.length > 0){
          let initData = objData[0];
          this.onCampaignClick(initData);
        }else{
          this.segmentParams.pxCampaignID = 'PXC-EMPTY';            
          this.ldPXSegmentDataSource.params = this.segmentParams;
          this.ldPXSegmentDataSource.isAutoLoad = false;
          this.ldPXSegmentDataSource.isProxy = true;
          this.showSegmentLoader = true;
          this.ldPXSegmentDataSource.loadData();
        }
        this.notifSvc.safelyDisablePageBusy(progressbarIdLoadLDMain);
      }).bind(this));

      if(objDirectData && objDirectData.CampaignDue > 0){
        this.pxCmapaignID = objDirectData.PXSegmentId;
        //this.deliveryMethod = objDirectData.deliveryMethods[0];
        this.currentCampainDue = objDirectData.CampaignDue === 1? CampaignDueEnum.All : this.currentCampainDue;

        if(this.deliveryStatusWidgets && this.deliveryStatusWidgets.data){
          let currWidget = this.deliveryStatusWidgets.data.find(a => a.key === this.currentCampainDue);
          this.selectedWidgetInit = currWidget;
        }

        this.campaignCardListParam.CampaignDue = this.currentCampainDue;
        this.ldCampaignPXDataSource.params = this.campaignCardListParam;
        this.onSearchCardEmitter(objDirectData.PXSegmentId);
        this.deliveryButtonInitialise();
        this.notifSvc.safelyDisablePageBusy(progressbarIdLoadLDMain);
      }else{
        this.ldCampaignPXDataSource.isAutoLoad = true;
      }

       this.segmentParams.pxCampaignID = this.pxCmapaignID;
       this.ldPXSegmentDataSource = new DataSourceModel(this.leadService);
       this.ldPXSegmentDataSource.params = this.segmentParams;
       this.ldPXSegmentDataSource.isProxy = true;
       this.ldPXSegmentDataSource.method = "getSegmentDataByCampID";
       this.ldPXSegmentDataSource.isAutoLoad = false;
       //this.leadDeliveryDataSource.loadData();
       this.initializeWidgets();

       this.ldCampaignPXDataSource.onDataSourceCallBack.subscribe(ev => {
        this.showCampaignLoader = false;
       });
       this.ldPXSegmentDataSource.onDataSourceCallBack.subscribe(ev => {
        this.showSegmentLoader = false;
       })
    }
    onFilterSegmentAssignedToMe(){
      this.currentGrid.resetPaginator();
      this.ldCampaignPXDataSource["filterObjectCriteria"] = [{fieldCode: 8, type: "Number", value: String(this.leadService.getLoggonUserId())} as filterQueryCriteria]
      this.ldCampaignPXDataSource.filterMethod = "filterCardTable";
      this.showCampaignLoader = true;
      this.ldCampaignPXDataSource["onFilterLoadData"]();
      this.ldCampaignPXDataSource.onFilterSuccessCallback.subscribe((objData => {
        if(objData && objData.length > 0){
          let initData = objData[0];
          this.onCampaignClick(initData);
        }else{
          this.ldPXSegmentDataSource.data = [];
          this.ldPXSegmentDataSource.isProxy = false;
          this.showSegmentLoader = true;
          this.ldPXSegmentDataSource.loadData();
        }
      }).bind(this));
    }

    onApplyFilter(event: any){
      this.currentGrid.resetPaginator();
      this.currentGrid.config.noDataMessage = "No campaigns available for the applied filters";
      this.ldCampaignPXDataSource["filterObjectCriteria"] = this.getFilterFieldsCriteria(event);
      this.ldCampaignPXDataSource.onFilterSuccessCallback.subscribe((objData => {
          if(objData && objData.length > 0){
            let initData = objData[0];
            this.onCampaignClick(initData);
          }
      }).bind(this));
      this.showCampaignLoader = true;
      this.ldCampaignPXDataSource["onFilterLoadData"]();
      this.filterToggle();
    }
    onClearFilters(event: any){
        this.currentGrid.config.noDataMessage = "No Records Found";
        this.clearFilterCriteriaFields(event);
    }
    lfcUsers: any[] =[];
    cxmUsers: any[] = [];
    paUsers: any[] = [];
    initUsersDataForFilter(){
      this.leadService.getUsersLFCGroup({"filterCriteria":[{"fieldCode": 11,"value": String(LeadDeliveryUserType.LFC),"type": "Array"}]}).subscribe((objUsers => {
              this.lfcUsers = objUsers.data.items.map(user => {
                  return {
                      text: user.firstName + ' ' + user.lastName,
                      value: user.id
                  }
              });
              this.lfcUsers.sort((x, y) => {
                let a = x.text.toUpperCase(),
                    b = y.text.toUpperCase();
                return a == b ? 0 : a > b ? 1 : -1;
              });
      }).bind(this));

      this.leadService.getUsersCXMGroup({"filterCriteria":  [{"fieldCode": 11,"value": String(LeadDeliveryUserType.CXM),"type": "Array"}]}).subscribe((objUsers => {
              this.cxmUsers = objUsers.data.items.map(user => {
                return {
                  text: user.firstName + ' ' + user.lastName,
                  value: user.id
                }
          });
          this.cxmUsers.sort((x, y) => {
            let a = x.text.toUpperCase(),
                b = y.text.toUpperCase();
            return a == b ? 0 : a > b ? 1 : -1;
          });
      }).bind(this));

      this.leadService.getUsersPAGroup({"filterCriteria": [{"fieldCode": 11,"value": String(LeadDeliveryUserType.PA) ,"type": "Array"}]}).subscribe((objUsers => {
            this.paUsers = objUsers.data.items.map(user => {
                  return {
                    text: user.firstName + ' ' + user.lastName,
                    value: user.id
                  }
            });
            this.paUsers.sort((x, y) => {
              let a = x.text.toUpperCase(),
                  b = y.text.toUpperCase();
              return a == b ? 0 : a > b ? 1 : -1;
            });
      }).bind(this));
    }

    initializeCustomFilter(fields, operator, filterform){

      let campStatus = [0, 1, 2, 3, 4, 5, 6,7];
      let campSchedule = [0, 1, 2,3,4,5, 6];
      let arrStatus = [];
      let arrSchedule = [];

      campStatus.forEach(e => {
        let val = this.campaignStatus[e];
        arrStatus.push({text: val , ctrlName: 'status' + e, value: e});
        this.filterFormGroup.addControl( 'status' + e, new FormControl());
      });

      this.filterFormGroup.get("status0").valueChanges.subscribe(val => {
        if(val){
            campStatus.forEach(e => {
                if(e !== 0){
                  let ctrl = this.filterFormGroup.get("status" + String(e))
                  ctrl.patchValue(true);
                  ctrl.disable();
                }
            });
            }else{
              campStatus.forEach(e => {
                if(e !== 0){
                  let ctrl = this.filterFormGroup.get("status" + String(e))
                  ctrl.patchValue(false);
                  ctrl.enable();
                }
              });
            }
      });


      campSchedule.forEach(e => {
        let val = this.campaignSchedule[e];
        arrSchedule.push({text: val , ctrlName: 'schedule' + e, value: e});
        this.filterFormGroup.addControl( 'schedule' + e, new FormControl());
        if(this.currentCampainDue !== CampaignDueEnum.All){
          this.filterFormGroup.get("schedule" + String(e)).disable();
        }
      });

      let getDay =  new Date().getDay()

      if (getDay === 1 || getDay === 2 || getDay === 3 || getDay === 4 || getDay === 5){
        if (this.currentCampainDue !== CampaignDueEnum.All){
          let ctrl = this.filterFormGroup.get("schedule" + String(getDay))
          let schedul6 = this.filterFormGroup.get("schedule6");
          schedul6.patchValue(true);
          schedul6.enable();
          ctrl.patchValue(true);
          ctrl.enable();
        }

      }

      this.filterFormGroup.get("schedule0").valueChanges.subscribe(val => {
        if(val){
          campSchedule.forEach(e => {
              if(e !== 0){
                let ctrl = this.filterFormGroup.get("schedule" + String(e))
                ctrl.patchValue(true);
                ctrl.disable();
              }
          });
        }else{
          campSchedule.forEach(e => {
            if(e !== 0){
              let ctrl = this.filterFormGroup.get("schedule" + String(e))
              ctrl.patchValue(false);
              ctrl.enable();
            }
          });
        }
      });

      this.customFilterFields = [
         {controlName: 'lfc', fieldType: 'dropdown', isFiltered: true } as filterFieldsMapping,
         {controlName: 'cxm', fieldType: 'dropdown', isFiltered: true } as filterFieldsMapping,
         {controlName: 'pa', fieldType: 'dropdown', isFiltered: true } as filterFieldsMapping,
         {controlName: 'isAssignedToMe', fieldType: 'checkbox', isFiltered: true } as filterFieldsMapping,
         {controlName: 'deliverStatus', fieldType: 'enum', isFiltered: true, isStatusType: true, arrEnumStatus: arrStatus} as filterFieldsMapping,
         {controlName: 'deliverSchedule', fieldType: 'enum', isFiltered: true, isStatusType: true, arrEnumStatus: arrSchedule} as filterFieldsMapping
      ]

      this.filterFormGroup.addControl('lfc', new FormControl());
      this.filterFormGroup.addControl('cxm', new FormControl());
      this.filterFormGroup.addControl('pa', new FormControl());
      this.filterFormGroup.addControl('isAssignedToMe', new FormControl(false));

      if(this.filterFormGroup.get("assignedToMeBar").value){
         this.filterFormGroup.get("isAssignedToMe").disable();
         this.disabledStatusFilterControl(this.filterFormGroup);
      }
      return true
    }
    enableStatusFilterControl(formFields: FormGroup){
      this.customFilterFields.forEach(objField => {
          if(objField["controlName"] === "deliverStatus"){
            if(objField["isStatusType"]){
              let hasValue = false;
              let arry: any[] = objField["arrEnumStatus"];
                arry.forEach(s => {
                  formFields.get(s.ctrlName).enable();
                });
            }
          }
      });
    }
    disabledStatusFilterControl(formFields: FormGroup){
      this.customFilterFields.forEach(objField => {
        if(objField["controlName"] === "deliverStatus"){
            if(objField["isStatusType"]){
              let hasValue = false;
              let arry: any[] = objField["arrEnumStatus"];
                arry.forEach(s => {
                  formFields.get(s.ctrlName).disable();
                });
            }
          }
      });
    }

    enableScheduleFilterControl(formFields: FormGroup){
      this.customFilterFields.forEach(objField => {
          if(objField["controlName"] === "deliverSchedule"){
            if(objField["isStatusType"]){
              let hasValue = false;
              let arry: any[] = objField["arrEnumStatus"];
                arry.forEach(s => {
                  formFields.get(s.ctrlName).enable();
                });
            }
          }
      });
    }
    disabledScheduleFilterControl(formFields: FormGroup){
      this.customFilterFields.forEach(objField => {
          if(objField["controlName"] === "deliverSchedule"){
            if(objField["isStatusType"]){
              let hasValue = false;
              let arry: any[] = objField["arrEnumStatus"];
                arry.forEach(s => {
                  formFields.get(s.ctrlName).disable();
                });
            }
          }
      });
    }
    clearFilterCriteriaFields(formFields: FormGroup){
      this.ldCampaignPXDataSource.filterObjectCriteria = [];
      this.customFilterFields.forEach(objField => {
        switch(objField["fieldType"]){
            case "dropdown" : {
                formFields.get(objField["controlName"]).setValue(0);
            }
            case "checkbox": {
               formFields.get(objField["controlName"]).setValue(false)
            }
            case "enum": {
              if(objField["isStatusType"]){
                  let hasValue = false;
                  let arry: any[] = objField["arrEnumStatus"];
                  arry.forEach(s => {
                    formFields.get(s.ctrlName).setValue(false);
                  });
              }
              break;
          }

          }
      });
    }
    getFilterFieldsCriteria(formFields: FormGroup)
    {
      let filterCriteriaObjectList: filterQueryCriteria[] = [];
      this.customFilterFields.forEach(objField => {
        let objectFilter: filterQueryCriteria = {} as filterQueryCriteria;
        objectFilter.fieldCode = CampaignColumnIds[objField["controlName"]]? CampaignColumnIds[objField["controlName"]] : objField["controlName"];
        switch(objField["fieldType"]){
            case "dropdown" : {
                if(formFields.get(objField["controlName"]).value !== 0 && formFields.get(objField["controlName"]).value !== false){
                    objectFilter.type = "Array";
                    let ddpValue = formFields.get(objField["controlName"]).value;
                    if(ddpValue && ddpValue.indexOf(0) > -1){
                      ddpValue.splice(0, 1);
                    }
                    if(ddpValue) {
                      objectFilter.value = ddpValue.join(',');
                    }

                }
                break;
            }
            case "checkbox": {
               if(formFields.get(objField["controlName"]).value !== false){
                  objectFilter.fieldCode = 9;
                  objectFilter.type = "Number";
                  objectFilter.value = String(this.leadService.getLoggonUserId());
               }
               break;
            }
            case "enum": {
              if(objField["isStatusType"]){
                  let hasValue = false;
                  let arry: any[] = objField["arrEnumStatus"];
                  objectFilter.enumValue = [];
                  arry.forEach(s => {
                    if(formFields.get(s.ctrlName).value){
                        s["IsFiltered"] = formFields.get(s.ctrlName).value;
                        s.value = String(s.value);
                        objectFilter.enumValue.push(s);
                    }
                  });
                  if(objectFilter.enumValue.length > 0){
                       let allDefault =  objectFilter.enumValue.find(v => v.value == 0);
                       if(allDefault){
                        objectFilter.enumValue = [];
                        objectFilter.enumValue.push(allDefault);
                       }
                      objectFilter.type = "Enum";
                  }
              }
              break;
          }

          }
          if(objectFilter.type){
            filterCriteriaObjectList.push(objectFilter);
          }
      });

      return filterCriteriaObjectList

    }
    onSearchCardEmitter(eventValue){
    //   of(this.serachBar.searchText).pipe(
    //     debounceTime(400),
    //     distinctUntilChanged(),
    //     switchMap((text)=> {
    //        return http.post('api_link', {searchText: text}).map(resp => {
    //          return resp['Result'];
    //        });
    //      });
    //  ).subscribe(response=> console.log(response));
      if (eventValue) {
        of(eventValue).pipe(
          debounceTime(400),
          distinctUntilChanged(),
          switchMap((text:any) => {
            return of(text);
          })).subscribe(value => {
            this.campaignCardListParam.CampaignDue = this.currentCampainDue;
            this.campaignCardListParam.pagination.skip = 0;
            this.ldCampaignPXDataSource.quickSearchValue = value;
            this.ldCampaignPXDataSource.quickSearchMethod = 'filterCardTable';
            this.ldCampaignPXDataSource.params = this.campaignCardListParam;
            this.ldCampaignPXDataSource.onQuickSearchCallBack.subscribe((objData => {
                if(objData["data"] && objData["data"].length > 0){
                    let initData = objData["data"][0];
                    if(this.currentSelected != initData){
                        this.onCampaignClick(initData);
                    }
                } else {
                    this.segmentParams.pxCampaignID = 'PXC-EMPTY';            
                    this.ldPXSegmentDataSource.params = this.segmentParams;
                    this.ldPXSegmentDataSource.isAutoLoad = false;
                    this.ldPXSegmentDataSource.isProxy = true;
                    this.showSegmentLoader = true;
                    this.ldPXSegmentDataSource.loadData();
                }
            }));
            if(this.currentGrid){
                this.currentGrid.doSearch();
            }else{
                this.ldCampaignPXDataSource.doSearch();
            }
          });

      } else {
        if(this.filterFormGroup.get("assignedToMeBar").value){
          this.ldCampaignPXDataSource.filterCriteriaInstance = [];
          this.onFilterSegmentAssignedToMe();
        }else{
          this.currentGrid.refresh();
        }
      }
    }
    IsSelected(data: any){
        if(this.currentSelected !== data){
          this.currentSelected = data;
        }
    }
    initializeWidgets() {
      this.deliveryStatusWidgets = new DataSourceModel(this.leadService);
      this.deliveryStatusWidgets.isProxy = true;
      this.deliveryStatusWidgets.method = "getLeadsStatusWidgets";
      this.deliveryStatusWidgets.onSuccessCallBack.subscribe((objData => {
          if(objData && objData.length > 0){
            let currWidget = objData.find(a => a.key === this.currentCampainDue);
            this.selectedWidgetInit = currWidget;
          }
      }).bind(this));
      this.deliveryStatusWidgets.loadData();
    }
    onCampaignLinkClick(event: any){
        this.notifSvc.setPageBusy(true);
        /*let data: any = {
           "campaigndata": event
        }
        this.route.navigate([`/LeadsDelivery/leadDetails/${event["pxSegmentID"].text}`], data);*/
    }
    refreshCampaignCard(){

      if(this.filterFormGroup.get("assignedToMeBar").value){
          this.onFilterSegmentAssignedToMe();
      }else{
          this.ldCampaignPXDataSource.isAutoLoad = true;
          this.deliveryStatusWidgets.loadData();
          this.currentGrid.refresh();
      }

    }
    onCampaignClick(data: any){
        if(data){ this.pxCmapaignID = data["pxCampaignID"];
        this.hasManual3P = data["hasManual3P"];
        if(data["noLeadsToDeliver"]){
          this.deliverBtnToolTip = "No Leads to Deliver";
        }
      
        //this.deliveryMethod = data.deliveryMethods[0];
        this.segmentParams.pxCampaignID = this.pxCmapaignID;
        if(this.filterFormGroup.get("assignedToMeBar").value){
           this.segmentParams["filterCriteria"] = [{fieldCode: 8, type: "Number", value: String(this.leadService.getLoggonUserId())} as filterQueryCriteria];
        } else {
          delete this.segmentParams["filterCriteria"];
        }

        this.ldPXSegmentDataSource.params = this.segmentParams;
        this.ldPXSegmentDataSource.isAutoLoad = false;
        this.ldPXSegmentDataSource.isProxy = true;
        this.showSegmentLoader = true;
        this.ldPXSegmentDataSource.loadData();
        this.onRefreshFile();
        this.IsSelected(data);
        this.deliveryButtonInitialise();
    }
  }
    onReplaceFile(event: any){
      this.disableAllLink();
      let dialogRef =  event.openDialog();
      dialogRef.afterClosed().subscribe(((result) => {
           this.uploaderService.clearQueue();
           this.enableAllLink();
      }).bind(this));
    }
    onDownloadFile(event: any){
      this.disableAllLink();
      this.leadService.onRequestDownload({"PXCampaignId": this.pxCmapaignID }).subscribe(respData=>{
        window.open(respData.data["url"], "_self");
        this.enableAllLink();
     });
    }
    disableAllLink(){
      this.disableRegenLink = true;
      this.disableGenLink = true;
      this.disableDonwloadLink = true;
      this.disableReplaceLink = true;
    }
    enableAllLink(){
      this.disableRegenLink = false;
      this.disableGenLink = false;
      this.disableDonwloadLink = false;
      this.disableReplaceLink = false;
    }
    onGenerateFile(event: any){
        let generatefileProgressID = this.notifSvc.setPageBusy(true);
        this.disableAllLink();
        this.leadService.onRequestGenerate({"PXCampaignId": this.pxCmapaignID }).subscribe(respData=>{
           if(respData.data["leadFileStatus"] === LeadFileStatus.Generating){
              this.fileMessage = "Generating lead file...";
              this.disableAllLink();
              this.leadFileTextColor = "none"
           }
           if(respData.data["leadFileStatus"] === LeadFileStatus.Error){
            this.fileMessage = "Lead File Generation Failed";
            this.leadFileTextColor = "red"
            this.disableRegenLink = false;
            this.disableGenLink = false;
           }
           this.notifSvc.safelyDisablePageBusy(generatefileProgressID);
        });
    }
    onHandleIconClick(isAllSelected: boolean, filterUserGroup: string, filterForm: FormGroup){
        if(isAllSelected){
          let listOfValue: number[] = [];
          listOfValue.push(0);
          listOfValue = listOfValue.concat(this[filterUserGroup + "Users"].map(item => item.value));
          filterForm.get(filterUserGroup).patchValue(listOfValue);
        } else{
           filterForm.get(filterUserGroup).patchValue([]);
        }
    }

    onHandleIndividualClick(allSelected: any, filterUserGroup: string, filterForm: FormGroup){
        if(allSelected.selected){
          allSelected.deselect();
          return false;
        }

        if(filterForm.get(filterUserGroup).value.length == this[filterUserGroup + "Users"].length){
           allSelected.select();
        };
    }

    onRefreshFile(){
      let refreshFileProgressID = this.notifSvc.setPageBusy(true);
      this.leadService.onRequestGetFileStatus({"PXCampaignId": this.pxCmapaignID }).subscribe(respData=>{
        this.leadFileTextColor = leadFileColor[respData.data["leadFileStatusColor"]]
        if(respData.data["leadFileStatus"] === LeadFileStatus.Generating){
          this.fileMessage = "Generating lead file...";
          this.dateTimeString = "";
          this.leadFileTextColor = "none";
          this.disableAllLink();
        }
        if(respData.data["leadFileStatus"] === LeadFileStatus.Generated){

           this.fileMessage = "Lead file generated" 
           if(respData.data["generatedDateTime"]){
            this.dateTimeString = "";
            let generatedDate = new Date(respData.data["generatedDateTime"]);
            this.dateTimeString = ' on ' + generatedDate.toLocaleDateString() + " " + generatedDate.toLocaleTimeString();
           }

           this.enableAllLink();
           this.showRegenerateLink = true;
        }
        if(respData.data["leadFileStatus"] === LeadFileStatus.None){
          this.fileMessage = "No lead file generated";
          this.dateTimeString = "";
          this.disableGenLink = false;
          this.showRegenerateLink = false;
          this.disableDonwloadLink = true;
          this.disableReplaceLink = true;
        }
        if(respData.data["leadFileStatus"] === LeadFileStatus.Replaced){
          this.fileMessage = "Lead file replaced";
          if(respData.data["generatedDateTime"]){
            this.dateTimeString = "";
            let generatedDate = new Date(respData.data["generatedDateTime"]);
            this.dateTimeString = ' on ' + generatedDate.toLocaleDateString() + " " + generatedDate.toLocaleTimeString();
           }

          this.enableAllLink();
          this.showRegenerateLink = true;
        }
        if(respData.data["leadFileStatus"] === LeadFileStatus.Error){
          this.fileMessage = "Lead File Generation Failed";
          this.dateTimeString = "";
          this.leadFileTextColor = "red"
          this.enableAllLink();
        }
        this.notifSvc.safelyDisablePageBusy(refreshFileProgressID);
      });
    }
    onRegenFile(event: any){
        this.onGenerateFile(this.pxCmapaignID);
    }
    onUploadComplete(event: any){

    }
    onErrorRaised(event: any){

    }
    removeFile(event: any){

    }
    uploadFile(event: any){
       this.uploaderService.removeWhenCompleted = false;
       this.uploaderService.uploadAll({
            isDefined: true,
            content: {
              "PXCampaignId": this.pxCmapaignID
            }
       });
    }
    closeUploadWindow(event: any){
      event.closeDialog();
      this.onRefreshFile();
      this.enableAllLink();
    }
    checkIfFileAdded(event: any){

    }
    isUsersByGroupLoaded: boolean = false;
    filterToggle(){
      if(!this.isUsersByGroupLoaded){
        this.initUsersDataForFilter();
        this.isUsersByGroupLoaded = true;
      }

       this.currentGrid.onDrawerToggle('filter');
    }
    onWidgetClick(ev){
      let widgetClickParam: any = { pagination: { includeTotal: true,  skip: 0, take : 10 } as IRequestPagination, CampaignDue: CampaignDueEnum.AllDue };
      if(ev.key === CampaignDueEnum.All) {
        this.currentCampainDue = CampaignDueEnum.All;
        widgetClickParam.CampaignDue = CampaignDueEnum.All;
        this.ldCampaignPXDataSource.params = widgetClickParam;

        this.enableScheduleFilterControl(this.filterFormGroup);

      }  else {
        this.currentCampainDue = ev.key;
        widgetClickParam.CampaignDue = ev.key;
        this.ldCampaignPXDataSource.params = widgetClickParam;
      }
      this.onClearFilters(this.filterFormGroup);
      this.currentGrid.refresh();
      //this.ldCampaignPXDataSource.loadData();
    }
    notifyCXM(ev) {
      let ds = this.currentSegmentGrid.dataSource;
      let hasNoLeads = false;
      if(ds && ds.filteredData.length > 0){
        hasNoLeads = ds.filteredData.filter(a => a["leadPreparationDone"]["value"] === 2).length > 0;
      }else{
        hasNoLeads = true;
      }

      if(!hasNoLeads){
         ev.openDialog();
      }else{
        this.notifSvc.openWarningToastr("Please complete the preparation of all segments assigned to you first.");
      }
     
    }
    deliverLeadsToClient(dialog) {
      this.uploadDialogHeaderText = "Notify CXM";
      this.uploadDialogDescriptionText = "Send notification to CXM for final review of leads.";
      dialog.openDialog();
    }
    cxmDialogClose(dialog, isClose) {
      if(isClose){
        dialog.closeDialog();
        return;
      }
      let params:IRequestDeliverLeadsClient = {
        PXCampaignId: this.pxCmapaignID,
        DeliveryNotes: this.cxmFieldSource.dsepFormGroup.value.deliveryNotes || '',
        DeliveryMethod: this.deliveryMethod
      }
      this.deliverLeadsBtnDisable = true;
      setTimeout(() => {
        this.deliverLeadsBtnDisable = false;
      },10000)
      this.leadService.deliverLeadsToClient(params).subscribe((response) => {
        let respData:any = response.data;
        if(respData && respData.success) {
          if(respData.deliverystatus === 4){
            if(this.currentSelected){
              this.currentSelected.deliveryStatus.color ="orange";
              this.currentSelected.deliveryStatus.value = 4;
            }
          }
        }else{
          if(respData.deliverystatus === 6){
            if(this.currentSelected){
              this.currentSelected.deliveryStatus.color ="red";
              this.currentSelected.deliveryStatus.value = 6;
            }
          }

        }
        dialog.closeDialog();
      })
    }
    lfcDialogClose(dialog, isClose){
      if(isClose){
        dialog.closeDialog();
        return;
      }
      let params:IRequestNotifyLeadsClient = {
        PXCampaignId: this.pxCmapaignID,
        UpdatedBy: this.leadService.getLoggonUserId()
      }
      this.leadService.notifyCXM(params).subscribe((response) => {
        let respData:any = response.data;
        if(respData && respData.success) {
          if(this.currentSelected){
            this.currentSelected.deliveryStatus.color = "amber";
            this.currentSelected.deliveryStatus.value = 3;
          }

          dialog.closeDialog();
          this._toasSvc.openSuccessfulMessage(`CXM has been notified`);
        }
      })
    }

    paDialogClose(dialog, isClose){
      if(isClose){
        dialog.closeDialog();
        return;
      }

      let params:IRequestDeliverLeadsClient = {
        PXCampaignId: this.pxCmapaignID,
        DeliveryNotes: '',
        DeliveryMethod: this.deliveryMethod
      }

      this.leadService.setcampaignDeliveryStatusToComplete(params).subscribe((response) => {
        let respData:any = response.data;
        if(respData && respData.success) {
          if(this.currentSelected){
            this.currentSelected.deliveryStatus.color =  "green";
            this.currentSelected.deliveryStatus.value = 5;
          }
        }
        dialog.closeDialog();
      })
    }

    deliveryButtonInitialise() {
      this.showLFCDeliveryButton = this.isLFCUser && !this.hasManual3P;
      this.showCXMDeliveryButton = this.isCXMUser && !this.hasManual3P;
      this.showPADeliveryButton =  (this.isLFCUser || this.isPAUser) && this.hasManual3P;
    }

    markCampaignComplete(dialog) {
      this.uploadDialogHeaderText = "Leads have been uploaded to the client’s platform?";
      dialog.openDialog();
    }
}
