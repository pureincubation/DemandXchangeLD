export enum LeadDeliveryStatus{
    "Approval Pending" = 1,
    "Completed" = 2,
    "In Progress" = 3,
    "To Do" = 4,
}

export enum AllLeadsDeliveryStatus{
  None = 0,
  Qualified = 1,
  UnderReview = 2,
  Unqualified = 3,
  Returned = 4,
  DuplicatesFirst = 5,
  DuplicatesRemaining = 6,
  "In Lead QA" = 7,
  "ErrorLeads" = 8,
}

export enum DeliveryMethod{
    "None" = 0,
    "Autopass" = 1,
    "Manual via Email" = 2,
    "Autopass and Manual" = 3,
    "Manual Upload to 3P" = 4
}

export enum LeadDeliveryUserType
{
    LFC = 325,
    CXM = 324,
    PA = 326
}

export enum LeadStatus{
    Qualified = 1,
    Unqualified = 2
}

export enum DeliveryStatus{
    All = 0,
    "Not Yet Delivered" = 1,
    "For Delivery" = 2,
    Delivered = 4,
    "Error" = 8,
    Unqualified = 16,
    "In Lead QA" = 32,
}

export enum LeadDetailsTable{
  campaignId = 1,
  deliveryStatus = 2
}

export enum CampaignListType{
    "All" =0,
    "To Do" = 1,
    "In Progress" = 2,
    "Approval Pending" = 3,
    "Sending" = 4,
    "Completed" = 5,
    "Error" = 6,
    "Sending Failed" = 7
}

export enum CampaignSchedule {
    "All" = 0,
    "Monday"  = 1,
    "Tuesday" = 2,
    "Wednesday" = 3,
    "Thursday" = 4,
    "Friday" = 5,
    "Realtime" =6
}

export enum CampaignDeliveryFrequency{
    "Daily" = 1,
    "Weekly" = 2,
    "Monthly" = 3,
    "Semi-Monthly" = 4,
    "Yearly" = 5
}

export enum LeadFileStatus
{
    None = 0,
    Generated = 1,
    Generating = 2,
    Replaced = 4,
    Error = 8
}

export enum CampaignDueEnum
{
    All = 1,
    AllDue = 2,
    Remaining = 3,
    Completed = 4,
    AutoPassTesting = 5,
    ToDo = 6,
    InProgress = 7,
    ApprovalPending = 8,
    SendingFailed = 9,
    AutoPassError = 10
}

export enum LeadPreparationDoneEnum
{
    None = 0,
    "No Leads" = 1,
    No = 2,
    Yes = 4,
    Error = 8,
    "N/A - Paused" = 16
}

export enum DismissedEnum
{
    No = 0,
    Yes = 1,
}

export enum leadFileColor
{
    none = 0,
    gray = 1,
    orange = 2,
    green = 3
}