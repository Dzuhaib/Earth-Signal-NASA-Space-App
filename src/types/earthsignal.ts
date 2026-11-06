/**
 * EarthSignal — Core TypeScript Interfaces & Types
 * NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!
 */

export type EnvironmentalVariableId =
  | 'T2M'
  | 'T2M_MAX'
  | 'T2M_MIN'
  | 'PRECTOTCORR'
  | 'RH2M'
  | 'GWETROOT'
  | 'GWETTOP'
  | 'GISTEMP_ANOMALY';

export type DatasetId =
  | 'nasa_power_monthly'
  | 'nasa_gistemp_v4'
  | 'nasa_gldas_noah'
  | 'nasa_merra2_reanalysis';

export interface DatasetMetadata {
  dataset_id: DatasetId;
  dataset_name: string;
  provider: string;
  product_version: string;
  variable_name: string;
  variable_id: EnvironmentalVariableId;
  variable_description: string;
  unit: string;
  temporal_resolution: string;
  spatial_resolution: string;
  geographic_coverage: string;
  temporal_coverage: {
    start: string;
    end: string;
  };
  processing_level: string;
  source_url: string;
  access_method: string;
  authentication_requirement: 'None (Open Public API)' | 'NASA Earthdata Login' | 'Open Download';
  update_frequency: string;
  known_limitations: string[];
}

export interface GeographicRegion {
  id: string;
  name: string;
  admin_level: 'province' | 'country' | 'special_zone' | 'global';
  country: string;
  latitude: number;
  longitude: number;
  bounding_box: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  area_km2?: number;
  is_flagship?: boolean;
  notes?: string;
  affected_level?: 'critical' | 'high' | 'moderate' | 'monitoring';
  affected_category?: 'Extreme Warming' | 'Drought & Desiccation' | 'Monsoon Volatility' | 'Glacial Melt' | 'Deforestation & Aridity';
  affected_description?: string;
}

export interface CityMarker {
  id: string;
  name: string;
  province?: string;
  country: string;
  latitude: number;
  longitude: number;
  population?: string;
  keyFeature: string;
  floodRiskLevel?: 'extreme' | 'high' | 'moderate' | 'low';
  floodHistory?: string;
  isFlagshipCity?: boolean;
}

export interface FloodYearRecord {
  year: number;
  label: string;
  rainfallAnomalyPct: number; // e.g. +340% for 2022
  soilSaturationPct: number; // e.g. 96% for 2022
  severity: 'extreme_flood' | 'high_flood' | 'moderate_runoff' | 'normal' | 'drought';
  headline: string;
  keyAffectedZones: string[];
  observedRainfallMm: number;
  baselineNormalMm: number;
}

export interface EnvironmentalObservation {
  timestamp: string; // "YYYY-MM" or "YYYY-MM-DD"
  date: string;
  year: number;
  month?: number;
  value: number;
  unit: string;
  anomaly?: number;
  is_missing?: boolean;
  is_interpolated?: boolean;
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'inconclusive';

export type TrendClassification =
  | 'significant_increasing'
  | 'significant_decreasing'
  | 'no_significant_trend'
  | 'insufficient_data'
  | 'analysis_unavailable';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // e.g. 0.95 for 95% CI
}

export interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r_squared: number;
  p_value: number;
  standard_error: number;
  confidence_interval: ConfidenceInterval;
}

export interface MannKendallResult {
  s_statistic: number;
  variance_s: number;
  z_statistic: number;
  p_value: number;
  kendall_tau: number;
  trend: 'increasing' | 'decreasing' | 'no_trend';
  is_significant: boolean;
  alpha: number;
}

export interface SensSlopeResult {
  slope: number; // change per unit time (monthly)
  slope_per_decade: number;
  slope_unit: string;
  intercept: number;
  confidence_interval: ConfidenceInterval;
  confidence_interval_per_decade: {
    lower: number;
    upper: number;
  };
}

export interface AutocorrelationResult {
  lag_1: number;
  is_autocorrelated: boolean;
  critical_value: number;
  effective_sample_size: number;
  correction_applied: boolean;
}

export interface DataQualityReport {
  total_observations: number;
  valid_observations: number;
  missing_observations: number;
  missing_ratio: number;
  duplicate_count: number;
  temporal_continuity: 'continuous' | 'minor_gaps' | 'severe_gaps';
  outliers_detected: number;
}

export interface DatasetProvenance {
  source_id: string;
  data_provider: string;
  endpoint_queried: string;
  retrieved_at: string;
  raw_payload_checksum?: string;
  citation: string;
  doi?: string;
}

/**
 * Official Challenge Analysis Response Schema
 */
export interface StatisticalAnalysisResponse {
  dataset_id: string;
  variable: EnvironmentalVariableId;
  variable_name: string;
  unit: string;
  location: {
    id: string;
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  period: {
    start: string;
    end: string;
    total_months: number;
  };
  sample_size: number;
  trend_direction: TrendDirection;
  trend_classification: TrendClassification;
  slope: number;
  slope_per_decade: number;
  slope_unit: string;
  p_value: number;
  adjusted_p_value: number;
  confidence_interval: ConfidenceInterval;
  is_significant: boolean;
  alpha_threshold: number;
  method: 'Mann-Kendall & Sen’s Slope' | 'Linear OLS' | 'Seasonal Mann-Kendall';
  linear_regression: LinearRegressionResult;
  mann_kendall: MannKendallResult;
  sens_slope: SensSlopeResult;
  autocorrelation: AutocorrelationResult;
  data_quality: DataQualityReport;
  limitations: string[];
  provenance: DatasetProvenance;
  observations: EnvironmentalObservation[];
}

export interface RegionalComparisonResponse {
  primary_region: StatisticalAnalysisResponse;
  secondary_region: StatisticalAnalysisResponse;
  comparison_metric: {
    slope_difference_per_decade: number;
    relative_change_ratio: number;
    both_significant: boolean;
    scientific_summary: string;
  };
}

export interface AIAskRequest {
  question: string;
  analysis_context?: StatisticalAnalysisResponse;
}

export interface AIAskResponse {
  answer: string;
  grounded_facts: {
    trend_direction: string;
    slope_per_decade: string;
    p_value: string;
    is_significant: boolean;
    dataset_cited: string;
    location_analyzed: string;
  };
  confidence_statement: string;
  uncertainty_notes: string[];
}
