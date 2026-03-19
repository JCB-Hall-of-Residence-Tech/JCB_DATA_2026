export interface BreakdownItem {
  id: string;
  name: string;
  up: number;
  pr: number;
  pb: number;
  rate: number;
  durationUploaded?: number;
  durationCreated?: number;
  durationPublished?: number;
}

export interface TrendItem {
  month: string;
  uploaded: number;
  processed: number;
  published: number;
}

export interface MonthlyByClientItem {
  client_id: string;
  month: string;
  uploaded: number;
  processed: number;
  published: number;
}

export interface KPIs {
  totalUploaded: number;
  totalProcessed: number;
  totalPublished: number;
  publishRate: number;
  processRate: number;
  avgDuration: number;
  dropGap: number;
}

export interface RiskRow {
  client_id: string;
  totalVideos: number;
  unknownInput: number;
  pubNoPlatform: number;
  pubNoUrl: number;
  totalCreated: number;
  totalPublished: number;
  outputTypesUsed: number;
  totalOutputTypes: number;
  createdHours: number;
}

export interface Page2Data {
  filters: {
    clients: string[];
  };
  kpis: KPIs;
  riskTable: RiskRow[];
  breakdowns: {
    channel: BreakdownItem[];
    client: BreakdownItem[];
    user: BreakdownItem[];
    inputType: BreakdownItem[];
    outputType: BreakdownItem[];
    language: BreakdownItem[];
  };
  trend: TrendItem[];
  monthlyByClient: MonthlyByClientItem[];
}

export type DimensionKey =
  | "channel"
  | "client"
  | "user"
  | "inputType"
  | "outputType"
  | "language";

export type ChartMode = "stacked" | "grouped";
export type MetricKey =
  | "uploaded_count"
  | "processed_count"
  | "published_count"
  | "uploaded_duration"
  | "processed_duration"
  | "published_duration";
export type SortKey = "pub" | "proc" | "rate";
