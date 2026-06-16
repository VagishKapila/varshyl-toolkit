export type ProjectType =
  | 'mixed_use'
  | 'commercial_ti'
  | 'residential'
  | 'industrial'
  | 'infrastructure'
  | 'other';

export type CompletionStatus =
  | 'site_prep'
  | 'foundation'
  | 'slab'
  | 'framing'
  | 'framing_upper'
  | 'mep_rough_in'
  | 'drywall'
  | 'roof_framing'
  | 'finishing'
  | 'unknown';

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'fog'
  | 'unknown';

export type PhotoCountBucket = '0' | '1-3' | '4-10' | '11+';

export type CrewSizeBucket = '1-2' | '3-5' | '6-10' | '11+';

export interface IntelligenceEvent {
  id: string;
  project_id: string;
  event_date: string;
  day_of_week: number;
  photo_count_bucket: PhotoCountBucket;
  crew_size_bucket: CrewSizeBucket;
  has_voice_notes: boolean;
  weather_condition: WeatherCondition;
  completion_status: CompletionStatus;
  delay_flag: boolean;
  safety_flag: boolean;
  deviation_flag: boolean;
  pipeline_version: string;
  created_at: string;
}

export interface ProjectSummary {
  total_events: string;
  delay_days: string;
  safety_days: string;
  deviation_days: string;
  voice_note_days: string;
  dominant_stage: CompletionStatus;
  dominant_weather: WeatherCondition;
  first_event: string;
  last_event: string;
}

export interface EventsResponse {
  projectId: string;
  total: number;
  events: IntelligenceEvent[];
}

export interface SummaryResponse {
  projectId: string;
  summary: ProjectSummary;
}

export interface SearchResponse {
  total: number;
  events: IntelligenceEvent[];
  suppressed?: boolean;
  reason?: string;
}

export interface CIEClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface SearchParams {
  flag?: 'delay' | 'safety' | 'deviation';
  stage?: CompletionStatus;
  project_type?: ProjectType;
}
