import { StringifyOptions } from "querystring";
import { CampaignDeliveryFrequency, CampaignListType, DeliveryMethod, LeadDeliveryStatus, LeadDeliveryUserType, LeadPreparationDoneEnum } from "../_enums/lead-delivery.enum";
import { IRequestPagination } from "./lead-delivery-main.interface";


export const CampaignColumnIds =
{
    pxcId: 1,
    pxcName: 2,
    cxm: 3,
    lfc: 4,
    pa: 5,
    deliverStatus: 6,
    deliverSchedule: 7
}

export interface UserContext {
    userType: LeadDeliveryUserType;
    userId: number;
    firstName: string;
    lastName: string;
    imageSrc: string;
}



export interface SegmentSectionMainColumns
{
    id: number;
    pxCampaignID?: string;
    pxSegmentID?: string;
    adminCID?: string | number;
    segmentName: string;
    leadsdeliveryQueue?: number;
    leadsdeliveredtoday?: number;
    deliverySchedule?: string;
    deliverDateTime?: Date;
    status?: LeadDeliveryStatus;
    isLock?: boolean;
    lockUserFullName?: string;
    userLFC?: LeadUserPersona;
    userCXM?: LeadUserPersona;
    userPA?: LeadUserPersona;
    notYetDeliver?: number;
    dueDate?: Date;
    leadPreparationDone?: LeadPreparationDoneEnum;
}

export interface LeadDeliveryColumns {
    id: number;
    cid: number;
    campaignName: string;
    leadsToDeliver: number;
    leadsDelivered?: number;
    deliverDateTime?: Date;
    status: LeadDeliveryStatus;
    isLock: boolean;
    lockUserFullName?: string;
    users?: LeadUserPersona[];
    deliveryMethod: DeliveryMethod;

}

export interface LeadUserPersona{
    id: number;
    firstName: string;
    lastName: string;
    avatarImagePath?: string;
    avatarText?: string;
    subText?: string;
    userGroup: number;
}

export interface IWidgets{
  count?: number | string;
  title: string;
  headerColor?: string;
  subHeader?: string;
  subHeaderColor?: string;
  alertText?: string;
  alertTextCount?: number;
  tooltipText?: string;
  showHelpIcon?: boolean;
  widgetType?: string;
  data?: any;
  backgroundColor?:any;
  text?: any;
  icon?: any;
  color?: any;
  refCode?: string;
}


export interface ICampaignDetails{
    pxCampignID: string;
    campaignName: string;
    campaignID: number;
    lfcUser?: UserContext;
    cmxUser?: UserContext;
    paUser?: UserContext;
    deliveryMethod?: DeliveryMethod;
    deliveryDate?: Date;
    deliveryFrequency?: CampaignDeliveryFrequency[]

}

export interface IRequestCampaignList
{
    pagination: IRequestPagination
}

export interface IResponseCampaignList
{
    data:{
        items: any[],
        totalCount: number,
        count: number
    }
    error: string[];
}

export interface IRequestDeliverLeadsClient{
  PXCampaignId: string,
  DeliveryNotes?: string,
  DeliveryMethod: number
}
export interface IRequestNotifyLeadsClient{
  PXCampaignId: string
  UpdatedBy: number
}
export interface IResponseDeliverLeadsClient{
  data: Object
  errors: []
}
