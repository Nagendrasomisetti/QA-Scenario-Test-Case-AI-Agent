import { AnalysisResponse, AnalysisSummary, DashboardStats } from '../types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiService {
  /**
   * Sends the user requirement and optional files to the backend for analysis.
   */
  static async analyzeRequirements(
    requirement: string,
    pdfFile?: File | null,
    imageFile?: File | null
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    
    if (requirement) {
      formData.append('requirement', requirement);
    }
    if (pdfFile) {
      formData.append('pdf_file', pdfFile);
    }
    if (imageFile) {
      formData.append('image_file', imageFile);
    }

    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `API error: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Fetches dashboard statistics.
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${API_BASE_URL}/analyses/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard metrics.');
    }
    return await response.json();
  }

  /**
   * Fetches list of analysis summaries.
   */
  static async listAnalyses(limit: number = 50, offset: number = 0): Promise<AnalysisSummary[]> {
    const response = await fetch(`${API_BASE_URL}/analyses?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error('Failed to load analysis history list.');
    }
    return await response.json();
  }

  /**
   * Searches previous analyses.
   */
  static async searchAnalyses(query: string): Promise<AnalysisSummary[]> {
    const response = await fetch(`${API_BASE_URL}/analyses/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error('Search request failed.');
    }
    return await response.json();
  }

  /**
   * Fetches the complete details of a specific analysis record.
   */
  static async getAnalysisDetail(id: number): Promise<AnalysisResponse> {
    const response = await fetch(`${API_BASE_URL}/analyses/${id}`);
    if (!response.ok) {
      throw new Error('Failed to retrieve analysis details.');
    }
    return await response.json();
  }

  /**
   * Deletes a specific analysis record.
   */
  static async deleteAnalysis(id: number): Promise<{ status: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/analyses/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete analysis record.');
    }
    return await response.json();
  }

  /**
   * Triggers a download of the PDF report.
   */
  static triggerPdfDownload(id: number): void {
    window.open(`${API_BASE_URL}/analyses/${id}/export/pdf`, '_blank');
  }

  /**
   * Triggers a download of the Excel sheet.
   */
  static triggerExcelDownload(id: number): void {
    window.open(`${API_BASE_URL}/analyses/${id}/export/excel`, '_blank');
  }
}

export default ApiService;
