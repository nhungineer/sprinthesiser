import { 
  projects, 
  transcripts, 
  themes, 
  analysisSettings,
  votingSessions,
  votes,
  type Project, 
  type Transcript, 
  type Theme, 
  type AnalysisSettings,
  type VotingSession,
  type Vote,
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
  getTheme(id: number): Promise<Theme | undefined>;
  getThemesByProject(projectId: number): Promise<Theme[]>;
  updateTheme(id: number, updates: UpdateThemeType): Promise<Theme | undefined>;
  deleteTheme(id: number): Promise<void>;
  clearThemes(): Promise<void>;
  
  // Analysis Settings
  createAnalysisSettings(settings: InsertAnalysisSettings): Promise<AnalysisSettings>;
  getAnalysisSettings(projectId: number): Promise<AnalysisSettings | undefined>;
  updateAnalysisSettings(projectId: number, settings: Partial<InsertAnalysisSettings>): Promise<AnalysisSettings | undefined>;
  
  // Voting Sessions
  createVotingSession(session: Omit<VotingSession, 'id' | 'createdAt'>): Promise<VotingSession>;
  getVotingSessionsByProject(projectId: number): Promise<VotingSession[]>;
  getActiveVotingSession(projectId: number): Promise<VotingSession | undefined>;
  updateVotingSession(id: number, updates: Partial<VotingSession>): Promise<VotingSession | undefined>;
  endVotingSession(id: number): Promise<void>;
  
  // Votes
  castVote(vote: Omit<Vote, 'id' | 'createdAt'>): Promise<Vote>;
  removeVote(sessionId: number, themeId: number, itemType: string, itemIndex: number | null, voterToken: string): Promise<void>;
  getVotesBySession(sessionId: number): Promise<Vote[]>;
  getVoteCount(sessionId: number, themeId: number, itemType: string, itemIndex?: number): Promise<number>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private transcripts: Map<number, Transcript>;
  private themes: Map<number, Theme>;
  private analysisSettings: Map<number, AnalysisSettings>;
  private votingSessions: Map<number, VotingSession>;
  private votes: Map<number, Vote>;
  private currentProjectId: number;
  private currentTranscriptId: number;
  private currentThemeId: number;
  private currentSettingsId: number;
  private currentSessionId: number;
  private currentVoteId: number;

  constructor() {
    this.projects = new Map();
    this.transcripts = new Map();
    this.themes = new Map();
    this.analysisSettings = new Map();
    this.votingSessions = new Map();
    this.votes = new Map();
    this.currentProjectId = 1;
    this.currentTranscriptId = 1;
    this.currentThemeId = 1;
    this.currentSettingsId = 1;
    this.currentSessionId = 1;
    this.currentVoteId = 1;

    // Create default project
    this.createProject({
      name: "Sprint Insights",
      description: "AI-powered synthesis assistant for Google Design Sprints",
      sprintGoal: ""
    });
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = {
      ...insertProject,
      id,
      description: insertProject.description ?? null,
      sprintGoal: insertProject.sprintGoal ?? null,
      sprintQuestions: insertProject.sprintQuestions ?? null,
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
      transcriptType: insertTranscript.transcriptType ?? null,
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
      description: insertTheme.description ?? null,
      hmwQuestions: insertTheme.hmwQuestions ?? null,
      aiSuggestedSteps: insertTheme.aiSuggestedSteps ?? null,
      votes: insertTheme.votes ?? 0,
      position: insertTheme.position ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.themes.set(id, theme);
    return theme;
  }

  async getTheme(id: number): Promise<Theme | undefined> {
    return this.themes.get(id);
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

  async clearThemes(): Promise<void> {
    this.themes.clear();
  }

  async createAnalysisSettings(insertSettings: InsertAnalysisSettings): Promise<AnalysisSettings> {
    const id = this.currentSettingsId++;
    const settings: AnalysisSettings = {
      ...insertSettings,
      id,
      painPoints: insertSettings.painPoints ?? true,
      featureRequests: insertSettings.featureRequests ?? true,
      userBehaviors: insertSettings.userBehaviors ?? false,
      emotions: insertSettings.emotions ?? false,
      themeCount: insertSettings.themeCount ?? "5-7",
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

  // Voting Sessions
  async createVotingSession(session: Omit<VotingSession, 'id' | 'createdAt'>): Promise<VotingSession> {
    const id = this.currentSessionId++;
    const newSession: VotingSession = {
      id,
      ...session,
      createdAt: new Date(),
    };
    this.votingSessions.set(id, newSession);
    return newSession;
  }

  async getVotingSessionsByProject(projectId: number): Promise<VotingSession[]> {
    return Array.from(this.votingSessions.values()).filter(session => session.projectId === projectId);
  }

  async getActiveVotingSession(projectId: number): Promise<VotingSession | undefined> {
    return Array.from(this.votingSessions.values()).find(session => 
      session.projectId === projectId && session.isActive
    );
  }

  async updateVotingSession(id: number, updates: Partial<VotingSession>): Promise<VotingSession | undefined> {
    const existing = this.votingSessions.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...updates };
    this.votingSessions.set(id, updated);
    return updated;
  }

  async endVotingSession(id: number): Promise<void> {
    const session = this.votingSessions.get(id);
    if (session) {
      session.isActive = false;
      session.endsAt = new Date();
      this.votingSessions.set(id, session);
      
      // Keep votes for final results display - don't clear them
      // The votes remain accessible for displaying final results after session ends
    }
  }

  // Votes
  async castVote(vote: Omit<Vote, 'id' | 'createdAt'>): Promise<Vote> {
    // Remove existing vote from same voter for same item if exists
    await this.removeVote(vote.sessionId, vote.themeId, vote.itemType, vote.itemIndex, vote.voterToken);
    
    const id = this.currentVoteId++;
    const newVote: Vote = {
      id,
      ...vote,
      createdAt: new Date(),
    };
    this.votes.set(id, newVote);
    return newVote;
  }

  async removeVote(sessionId: number, themeId: number, itemType: string, itemIndex: number | null, voterToken: string): Promise<void> {
    const votesToDelete = Array.from(this.votes.entries())
      .filter(([_, vote]) => 
        vote.sessionId === sessionId && 
        vote.themeId === themeId && 
        vote.itemType === itemType && 
        vote.itemIndex === itemIndex && 
        vote.voterToken === voterToken
      )
      .map(([voteId]) => voteId);
    
    votesToDelete.forEach(voteId => this.votes.delete(voteId));
  }

  async getVotesBySession(sessionId: number): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(vote => vote.sessionId === sessionId);
  }

  async getVoteCount(sessionId: number, themeId: number, itemType: string, itemIndex?: number): Promise<number> {
    return Array.from(this.votes.values()).filter(vote => 
      vote.sessionId === sessionId && 
      vote.themeId === themeId && 
      vote.itemType === itemType && 
      vote.itemIndex === (itemIndex ?? null)
    ).length;
  }
}

export const storage = new MemStorage();
