export interface Scenario {
  id: string;
  title: string;
  description: string;
}

export interface TestCase {
  id: string;
  scenario_id: string;
  title: string;
  preconditions: string;
  steps: string[];
  expected_result: string;
}

export interface PositiveCase {
  id: string;
  title: string;
  steps: string[];
  expected_result: string;
}

export interface NegativeCase {
  id: string;
  title: string;
  steps: string[];
  expected_result: string;
}

export interface EdgeCase {
  id: string;
  title: string;
  steps: string[];
  expected_result: string;
}

export interface Risk {
  id: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
  mitigation: string;
}

export interface MissingRequirement {
  id: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

export interface AnalysisResponse {
  id?: number;  # Database ID
  source_type: 'text' | 'pdf' | 'image';
  confidence_score: number;
  pages_processed: number;
  characters_extracted: number;
  visual_observations: string[];
  scenarios: Scenario[];
  test_cases: TestCase[];
  positive_cases: PositiveCase[];
  negative_cases: NegativeCase[];
  edge_cases: EdgeCase[];
  risks: Risk[];
  missing_requirements: MissingRequirement[];
}
export interface AnalysisSummary {
  id: number;
  title: string;
  source_type: 'text' | 'pdf' | 'image';
  created_at: string;
  scenarios_count: number;
  test_cases_count: number;
}

export interface DashboardStats {
  total_analyses: number;
  text_analyses: number;
  pdf_analyses: number;
  image_analyses: number;
  pages_processed_sum: number;
  average_processing_time_ms: number;
  analyses_this_week: number;
  analyses_this_month: number;
  recent_activity: {
    id: number;
    title: string;
    source_type: 'text' | 'pdf' | 'image';
    created_at: string;
  }[];
}
