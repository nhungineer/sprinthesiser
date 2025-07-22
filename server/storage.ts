import { 
  projects, 
  transcripts, 
  themes, 
  analysisSettings,
  type Project, 
  type Transcript, 
  type Theme, 
  type AnalysisSettings,
  type InsertProject, 
  type InsertTranscript, 
  type InsertTheme,
  type InsertAnalysisSettings,
  type UpdateThemeType,
  type Quote
} from "@shared/schema";

export interface IStorage {
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  
  // Transcripts
  createTranscript(transcript: InsertTranscript): Promise<Transcript>;
  getTranscriptsByProject(projectId: number): Promise<Transcript[]>;
  deleteTranscript(id: number): Promise<void>;
  
  // Themes
  createTheme(theme: InsertTheme): Promise<Theme>;
  getThemesByProject(projectId: number): Promise<Theme[]>;
  updateTheme(id: number, updates: UpdateThemeType): Promise<Theme | undefined>;
  deleteTheme(id: number): Promise<void>;
  
  // Analysis Settings
  createAnalysisSettings(settings: InsertAnalysisSettings): Promise<AnalysisSettings>;
  getAnalysisSettings(projectId: number): Promise<AnalysisSettings | undefined>;
  updateAnalysisSettings(projectId: number, settings: Partial<InsertAnalysisSettings>): Promise<AnalysisSettings | undefined>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private transcripts: Map<number, Transcript>;
  private themes: Map<number, Theme>;
  private analysisSettings: Map<number, AnalysisSettings>;
  private currentProjectId: number;
  private currentTranscriptId: number;
  private currentThemeId: number;
  private currentSettingsId: number;

  constructor() {
    this.projects = new Map();
    this.transcripts = new Map();
    this.themes = new Map();
    this.analysisSettings = new Map();
    this.currentProjectId = 1;
    this.currentTranscriptId = 1;
    this.currentThemeId = 1;
    this.currentSettingsId = 1;

    // Create default project
    this.createProject({
      name: "Research Analysis Project",
      description: "AI-powered theme extraction from user interviews"
    });
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      createdAt: new Date(),
    };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async createTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const id = this.currentTranscriptId++;
    const transcript: Transcript = {
      ...insertTranscript,
      id,
      uploadedAt: new Date(),
    };
    this.transcripts.set(id, transcript);
    return transcript;
  }

  async getTranscriptsByProject(projectId: number): Promise<Transcript[]> {
    return Array.from(this.transcripts.values()).filter(
      (transcript) => transcript.projectId === projectId
    );
  }

  async deleteTranscript(id: number): Promise<void> {
    this.transcripts.delete(id);
  }

  async createTheme(insertTheme: InsertTheme): Promise<Theme> {
    const id = this.currentThemeId++;
    const theme: Theme = {
      ...insertTheme,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.themes.set(id, theme);
    return theme;
  }

  async getThemesByProject(projectId: number): Promise<Theme[]> {
    return Array.from(this.themes.values())
      .filter((theme) => theme.projectId === projectId)
      .sort((a, b) => a.position - b.position);
  }

  async updateTheme(id: number, updates: UpdateThemeType): Promise<Theme | undefined> {
    const theme = this.themes.get(id);
    if (!theme) return undefined;

    const updatedTheme: Theme = {
      ...theme,
      ...updates,
      updatedAt: new Date(),
    };
    this.themes.set(id, updatedTheme);
    return updatedTheme;
  }

  async deleteTheme(id: number): Promise<void> {
    this.themes.delete(id);
  }

  async createAnalysisSettings(insertSettings: InsertAnalysisSettings): Promise<AnalysisSettings> {
    const id = this.currentSettingsId++;
    const settings: AnalysisSettings = {
      ...insertSettings,
      id,
    };
    this.analysisSettings.set(id, settings);
    return settings;
  }

  async getAnalysisSettings(projectId: number): Promise<AnalysisSettings | undefined> {
    return Array.from(this.analysisSettings.values()).find(
      (settings) => settings.projectId === projectId
    );
  }

  async updateAnalysisSettings(
    projectId: number, 
    updates: Partial<InsertAnalysisSettings>
  ): Promise<AnalysisSettings | undefined> {
    const settings = Array.from(this.analysisSettings.values()).find(
      (s) => s.projectId === projectId
    );
    if (!settings) return undefined;

    const updatedSettings: AnalysisSettings = {
      ...settings,
      ...updates,
    };
    this.analysisSettings.set(settings.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
