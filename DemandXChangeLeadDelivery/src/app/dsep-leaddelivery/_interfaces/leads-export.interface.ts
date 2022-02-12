export interface ILeadsExport {
    ExportType: string;
    CampaignID: number;
    FilterCriteria: any[];
    Columns: number[];
    Email: string;
    DeliveryStatus: number;
    Sort: any;
}