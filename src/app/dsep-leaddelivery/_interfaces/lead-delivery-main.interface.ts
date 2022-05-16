import { LeadDeliveryUserType } from "../_enums/lead-delivery.enum";

export interface UserContextLeadDelivery
{
    userId: string | number
    firstName: string
    lastName: string
    groupIds: number[]
    userPersona: LeadDeliveryUserType 
}

export interface IRequestPagination
{
    skip: number,
    take: number,
    includeTotal: boolean
}

export interface IRequestSort{
    fieldCode: number,
    direction: string
}

export interface IResponseLeadFile{
        data: Object
        errors: []
}