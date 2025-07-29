import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sprintGoal: text("sprint_goal"),
  sprintQuestions: text("sprint_questions").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transcripts = pgTable("transcripts", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  fileType: text("file_type").notNull(),
  transcriptType: text("transcript_type"), // 'expert_interview' | 'user_testing' | 'auto_detect'
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const themes = pgTable("themes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  quotes: jsonb("quotes").$type<Quote[]>().notNull(),
  hmwQuestions: text("hmw_questions").array(), // How Might We questions
  category: text("category").notNull(), // 'opportunities', 'pain_points', 'ideas_hmws'
  votes: integer("votes").default(0),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const analysisSettings = pgTable("analysis_settings", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  painPoints: boolean("pain_points").default(true),
  featureRequests: boolean("feature_requests").default(true),
  userBehaviors: boolean("user_behaviors").default(false),
  emotions: boolean("emotions").default(false),
  themeCount: text("theme_count").default("5-7").notNull(),
});

// Types
export interface Quote {
  text: string;
  source: string;
  transcriptId: number;
}

export interface FileUpload {
  filename: string;
  content: string;
  fileType: string;
}

export interface ThemeExtractionRequest {
  transcripts: string[];
  settings: {
    painPoints: boolean;
    featureRequests: boolean;
    userBehaviors: boolean;
    emotions: boolean;
    themeCount: string;
  };
}

export interface ExtractedTheme {
  title: string;
  description?: string;
  quotes: Quote[];
  color: string;
}

// Schemas
export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
});

export const insertTranscriptSchema = createInsertSchema(transcripts).omit({
  id: true,
  uploadedAt: true,
});

export const insertThemeSchema = createInsertSchema(themes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnalysisSettingsSchema = createInsertSchema(analysisSettings).omit({
  id: true,
});

export const fileUploadSchema = z.object({
  filename: z.string(),
  content: z.string(),
  fileType: z.string(),
});

export const textInputSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

export const themeExtractionSchema = z.object({
  transcripts: z.array(z.string()),
  settings: z.object({
    painPoints: z.boolean(),
    featureRequests: z.boolean(),
    userBehaviors: z.boolean(),
    emotions: z.boolean(),
    themeCount: z.string(),
  }),
});

export const updateThemeSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  quotes: z.array(z.object({
    text: z.string(),
    source: z.string(),
    transcriptId: z.number(),
  })).optional(),
  position: z.number().optional(),
});

// Inferred types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type InsertTranscript = z.infer<typeof insertTranscriptSchema>;
export type InsertTheme = z.infer<typeof insertThemeSchema>;
export type InsertAnalysisSettings = z.infer<typeof insertAnalysisSettingsSchema>;
export type FileUploadType = z.infer<typeof fileUploadSchema>;
export type TextInputType = z.infer<typeof textInputSchema>;
export type ThemeExtractionType = z.infer<typeof themeExtractionSchema>;
export type UpdateThemeType = z.infer<typeof updateThemeSchema>;

export type Project = typeof projects.$inferSelect;
export type Transcript = typeof transcripts.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type AnalysisSettings = typeof analysisSettings.$inferSelect;
