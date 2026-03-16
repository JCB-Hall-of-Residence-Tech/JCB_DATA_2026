export interface Page1KPIs {
  humanHoursSaved: number;
  humanHoursSavedFormatted: string;
  humanHoursTrendPct: number;

  timeToMarketHours: number;
  timeToMarketTrendPct: number;

  contentWasteFormatted: string;
  contentWasteSeconds: number;
  contentWasteTrendPct: number;

  clientConcentrationPct: number;
  clientConcentrationTrendPct: number;

  totalUploadedCount: number;
  totalUploadedDurationFormatted: string;
  totalUploadedTrendPct: number;

  totalCreated: number;
  totalCreatedTrendPct: number;

  aiContentMultiplier: number;
  aiMultiplierTrendPct: number;

  periodOverPeriodGrowthPct: number;

  topPerformingOutputType: string;
}

export interface LifecycleTrendData {
  byClient: Record<string, { month: string; count: number; duration: number }[]>;
  clients: string[];
}

export interface PipelineStatsData {
  totalUploaded: number;
  totalProcessed: number;
  monthly: { month: string; uploaded: number; created: number }[];
}

export interface EfficiencyPoint {
  client_id: string;
  channel_name: string;
  created_count: number;
  published_count: number;
  publish_rate: number;
}

export interface DataHealthAlert {
  video_id: string;
  headline: string;
  published_platform: string;
  user_id: string;
  issue_type: string;
}

export interface TopFormatsRow {
  month: string;
  [outputType: string]: string | number;
}

export interface Page1Data {
  kpis: Page1KPIs;
  lifecycleTrend: LifecycleTrendData;
  pipelineStats: PipelineStatsData;
  efficiencyMatrix: EfficiencyPoint[];
  topFormatsOverTime: TopFormatsRow[];
  topFormatsOutputTypes: string[];
  dataHealthAlerts: DataHealthAlert[];
}
