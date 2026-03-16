export interface Page1KPIs {
  humanHoursSaved: number;
  humanHoursSavedFormatted: string;
  humanHoursTrendPct: number;
  humanHoursCurrentFormatted?: string;
  humanHoursPrevFormatted?: string;

  timeToMarketHours: number;
  timeToMarketTrendPct: number;
  timeToMarketCurrentHours?: number;
  timeToMarketPrevHours?: number;

  contentWasteFormatted: string;
  contentWasteSeconds: number;
  contentWasteTrendPct: number;
  contentWasteCurrentFormatted?: string;
  contentWastePrevFormatted?: string;

  clientConcentrationPct: number;
  clientConcentrationTrendPct: number;
  clientConcentrationCurrentPct?: number;
  clientConcentrationPrevPct?: number;

  totalUploadedCount: number;
  totalUploadedDurationFormatted: string;
  totalUploadedTrendPct: number;
  currentMonthUploaded?: number;
  currentMonthUploadedDurationFormatted?: string;
  prevMonthUploaded?: number;
  currentMonthCreated?: number;
  prevMonthCreated?: number;

  totalCreated: number;
  totalCreatedTrendPct: number;

  aiContentMultiplier: number;
  aiMultiplierTrendPct: number;
  currentMonthMultiplier?: number;
  prevMonthMultiplier?: number;

  periodOverPeriodGrowthPct: number;
  currentMonthCombined?: number;
  prevMonthCombined?: number;

  topPerformingOutputType: string;
  topOutputCurrentMonth?: string;
  topOutputPrevMonth?: string;

  prevMonthLabel?: string;
  currentMonthLabel?: string;
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
