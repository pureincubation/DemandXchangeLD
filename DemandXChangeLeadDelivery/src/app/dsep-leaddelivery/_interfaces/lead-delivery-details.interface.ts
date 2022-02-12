import { filterQueryCriteria } from '../../../_shared/dsep-components/v0.2/_interfaces/dsep-filter-criteria.interface'
import { DeliveryStatus } from '../_enums/lead-delivery.enum';
import { IRequestSort } from './lead-delivery-main.interface';


export const LeadDeliveryColumnId = {
    leadId: 1,
    pXLeadId:2,
    campaignId:3,
    status: 4,
    deliveryStatus: 5,
    deliveryDate: 6,
    firstName: 7,
    lastName: 8,
    email: 9,
    address: 10,
    city: 11,
    state: 12,
    zip: 13,
    country: 14,
    companyName:15,
    phone: 16,
    companySize: 17,
    industry: 18,
    jobTitle:19,
    createdAt: 20, 
    leadResource: 21,
    dismissed: 22,
    error:23,
    uqAndReturnNotes: 24,
    channel: 25,
    partner: 26,    
    uqAndReturnNotesText:27,
    reasonForReturn:28
}

export const SegmentSectionMainColumns=
{
    id: 1,
    pxCampaignID:2 ,
    pxSegmentID: 3,
    adminCID: 4  ,
    segmentName:5 ,
    leadsdeliveryQueue:6 ,
    leadsdeliveredtoday:7 ,
    deliverySchedule: 8,
    deliverDateTime:9,
    status:10,
    isLock: 11,
    lockUserFullName: 12,
    userLFC:13 ,
    userCXM: 14,
    userPA:15 ,
    notYetDeliver:16 ,
   
}

export interface LeadDetailListColumn
{
    id?: number,
    status: number,
    deliveryStatus: number,
    error: number,
    deliveryDate: string,
    firstName: string,
    lastName: string,
    email: string,
    phone: number,
    address: string,
    city: string,
    state: string,
    zip: number,
    country: string,
    leadResource: string,
    industry: string,
    jobTitle:string,
    company: string,
    companySize: string,
    createdAt: number,
    uqAndReturnNotesText: string,
    returnReason:string
}

export interface RequestLeadStatus
{
    status: number,
    adminCampaignId: number,
    pxSegmentId: string,
    leadId: number[]
}

export interface RequestRepostStatus
{
    campaignId: number,
    leadIds: number[]
}

export interface IResponseLeadDetailsList
{
    data:{
        items: any[],
        totalCount: number
    }
    error: string[];
}

export interface IResponseLeadDetailsCount
{
    data:{
        count: number
    }
    error: string[];
}

export interface IRequestLeadsList
{

  campaignId: number,
  deliveryStatus: DeliveryStatus,
  pagination: IRequestPagination,
  filterCriteria?: filterQueryCriteria[]
  sort: IRequestSort[];
  includeUnqualifiedReasons?: boolean;
  IsClientRejected?:boolean,
  IsNeedReplacement?:boolean
  exportType?: string;
}

export interface IRequestPagination
{
    skip: number,
    take: number,
    includeTotal: boolean
}

export interface ISegmentWidgetLeadsStatus
{
    data:{
        items: [{    
            ordered: number,
            gross: number,
            underReview: number,
            qualified: number,
            unqualified: number,
            delivered: number,
            returned: number,
            outstanding: number,
            underReviewUQNYD: number,
            underReviewInQA: number,
            clientRejected: number,
            clientAccepted: number,
            uqDismissedInternalReturns: number 
        }],
        totalCount: number
    }
    error: string[];

}

export interface IResponseDataStats
{
    data: ILeadsStatisticsProcessLogModel    
}

export interface ILeadsStatisticsProcessLogModel
{
    id: number
    batchId: string
    bampaignId: number
    startedOn:  string
    completedOn: string
    processed: boolean
    createdOn: string
    updatedOn: string
    isDeleted: boolean
}
