import { apiRequest } from "./queryClient";
import { FileUploadType, TextInputType, ThemeExtractionType, UpdateThemeType } from "@shared/schema";

export const api = {
  // Projects
  getProject: () => apiRequest('GET', '/api/project'),
  
  // Files and Text
  uploadFiles: (formData: FormData) => apiRequest('POST', '/api/upload', formData),
  addText: (data: TextInputType) => apiRequest('POST', '/api/text', data),
  
  // Transcripts
  getTranscripts: () => apiRequest('GET', '/api/transcripts'),
  deleteTranscript: (id: number) => apiRequest('DELETE', `/api/transcripts/${id}`),
  
  // Themes
  extractThemes: (data: ThemeExtractionType) => apiRequest('POST', '/api/extract-themes', data),
  getThemes: () => apiRequest('GET', '/api/themes'),
  updateTheme: (id: number, data: UpdateThemeType) => apiRequest('PATCH', `/api/themes/${id}`, data),
  deleteTheme: (id: number) => apiRequest('DELETE', `/api/themes/${id}`),
  
  // Export
  exportData: (format: string) => apiRequest('GET', `/api/export/${format}`),
  
  // Settings
  getAnalysisSettings: () => apiRequest('GET', '/api/analysis-settings'),
};
