import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { FileParserService } from "./services/fileParser";
import { OpenAIService } from "./services/openai";
import { ExportService } from "./services/export";
import { SprintAIService } from "./services/sprintAI";
import { 
  fileUploadSchema, 
  textInputSchema, 
  themeExtractionSchema,
  updateThemeSchema,
  insertAnalysisSettingsSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.md'));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const DEFAULT_PROJECT_ID = 1;

  // Get project info
  app.get("/api/project", async (req, res) => {
    try {
      const project = await storage.getProject(DEFAULT_PROJECT_ID);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Upload files
  app.post("/api/upload", upload.array('files'), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = req.files as Express.Multer.File[];
      const uploadedTranscripts = [];

      for (const file of files) {
        // Determine file type from extension
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || '';
        const fileContent = file.buffer.toString('utf-8');

        const fileData = {
          filename: file.originalname,
          content: fileContent,
          fileType: fileExtension,
        };

        // Validate file
        const validation = FileParserService.validateFile(fileData);
        if (!validation.valid) {
          return res.status(400).json({ message: validation.error });
        }

        // Parse file content
        const parsedContent = await FileParserService.parseFile(fileData);

        // Store transcript
        const transcript = await storage.createTranscript({
          projectId: DEFAULT_PROJECT_ID,
          filename: file.originalname,
          content: parsedContent,
          fileType: fileExtension,
        });

        uploadedTranscripts.push(transcript);
      }

      res.json({ 
        message: "Files uploaded successfully", 
        transcripts: uploadedTranscripts 
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload files", error: error.message });
    }
  });

  // Sprint synthesis - new Design Sprint specific route
  app.post("/api/sprint/synthesize", async (req, res) => {
    try {
      const { content, sprintGoal } = req.body;
      
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: "Content is required" });
      }

      // Extract Sprint insights using specialized AI service
      const sprintThemes = await SprintAIService.extractSprintInsights(content, sprintGoal);
      
      // Store themes in database
      const storedThemes = [];
      for (let i = 0; i < sprintThemes.length; i++) {
        const theme = sprintThemes[i];
        const storedTheme = await storage.createTheme({
          projectId: DEFAULT_PROJECT_ID,
          title: theme.title,
          description: theme.description,
          color: theme.color,
          quotes: theme.quotes,
          category: theme.category,
          hmwQuestions: theme.hmwQuestions || [],
          position: i,
        });
        storedThemes.push(storedTheme);
      }

      // Store the transcript content too
      await storage.createTranscript({
        projectId: DEFAULT_PROJECT_ID,
        filename: "Pasted Content",
        content: content,
        fileType: "text",
        transcriptType: "auto_detect"
      });

      res.json({ 
        message: "Sprint synthesis completed successfully", 
        themes: storedThemes 
      });
    } catch (error) {
      console.error("Sprint synthesis error:", error);
      res.status(500).json({ message: "Failed to synthesize sprint insights", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Add text content
  app.post("/api/text", async (req, res) => {
    try {
      const validation = textInputSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid text input", errors: validation.error.errors });
      }

      const { content } = validation.data;
      const formattedContent = FileParserService.formatForAI(content);

      const transcript = await storage.createTranscript({
        projectId: DEFAULT_PROJECT_ID,
        filename: `Pasted Text ${new Date().toISOString()}`,
        content: formattedContent,
        fileType: 'txt',
      });

      res.json({ message: "Text added successfully", transcript });
    } catch (error) {
      res.status(500).json({ message: "Failed to add text", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get transcripts
  app.get("/api/transcripts", async (req, res) => {
    try {
      const transcripts = await storage.getTranscriptsByProject(DEFAULT_PROJECT_ID);
      res.json(transcripts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transcripts", error: error.message });
    }
  });

  // Delete transcript
  app.delete("/api/transcripts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTranscript(id);
      res.json({ message: "Transcript deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transcript", error: error.message });
    }
  });

  // Extract themes using AI
  app.post("/api/extract-themes", async (req, res) => {
    try {
      const validation = themeExtractionSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid extraction request", errors: validation.error.errors });
      }

      const extractionRequest = validation.data;
      
      // Get all transcripts for the project
      const transcripts = await storage.getTranscriptsByProject(DEFAULT_PROJECT_ID);
      if (transcripts.length === 0) {
        return res.status(400).json({ message: "No transcripts found. Please upload files or add text first." });
      }

      // Extract themes using OpenAI
      const transcriptContents = transcripts.map(t => t.content);
      const extractedThemes = await OpenAIService.extractThemes({
        transcripts: transcriptContents,
        settings: extractionRequest.settings,
      });

      // Store themes in database
      const storedThemes = [];
      for (let i = 0; i < extractedThemes.length; i++) {
        const theme = extractedThemes[i];
        const storedTheme = await storage.createTheme({
          projectId: DEFAULT_PROJECT_ID,
          title: theme.title,
          description: theme.description,
          color: theme.color,
          quotes: theme.quotes,
          category: 'opportunities', // Default category for Design Sprint
          position: i,
        });
        storedThemes.push(storedTheme);
      }

      // Store analysis settings
      await storage.createAnalysisSettings({
        projectId: DEFAULT_PROJECT_ID,
        ...extractionRequest.settings,
      });

      res.json({ 
        message: "Themes extracted successfully", 
        themes: storedThemes 
      });
    } catch (error) {
      console.error("Theme extraction error:", error);
      res.status(500).json({ message: "Failed to extract themes", error: error.message });
    }
  });

  // Get themes
  app.get("/api/themes", async (req, res) => {
    try {
      const themes = await storage.getThemesByProject(DEFAULT_PROJECT_ID);
      res.json(themes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get themes", error: error.message });
    }
  });

  // Create theme
  app.post("/api/themes", async (req, res) => {
    try {
      const validation = updateThemeSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid theme data", errors: validation.error.errors });
      }

      const themeData = {
        projectId: DEFAULT_PROJECT_ID,
        ...validation.data,
        position: validation.data.position || 0,
      };

      const newTheme = await storage.createTheme(themeData);
      res.json({ message: "Theme created successfully", theme: newTheme });
    } catch (error) {
      res.status(500).json({ message: "Failed to create theme", error: error.message });
    }
  });

  // Update theme
  app.patch("/api/themes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validation = updateThemeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid theme update", errors: validation.error.errors });
      }

      const updatedTheme = await storage.updateTheme(id, validation.data);
      if (!updatedTheme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      res.json({ message: "Theme updated successfully", theme: updatedTheme });
    } catch (error) {
      res.status(500).json({ message: "Failed to update theme", error: error.message });
    }
  });

  // Delete theme
  app.delete("/api/themes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTheme(id);
      res.json({ message: "Theme deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete theme", error: error.message });
    }
  });

  // Export themes
  app.get("/api/export/:format", async (req, res) => {
    try {
      const format = req.params.format.toLowerCase();
      const project = await storage.getProject(DEFAULT_PROJECT_ID);
      const themes = await storage.getThemesByProject(DEFAULT_PROJECT_ID);
      const transcripts = await storage.getTranscriptsByProject(DEFAULT_PROJECT_ID);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const exportData = { project, themes, transcripts };

      let result: any;
      let contentType: string;
      let filename: string;

      switch (format) {
        case 'json':
          result = await ExportService.exportToJSON(exportData);
          contentType = 'application/json';
          filename = 'themes.json';
          break;
        case 'csv':
          result = await ExportService.exportToCSV(exportData);
          contentType = 'text/csv';
          filename = 'themes.csv';
          break;
        case 'excel':
          result = await ExportService.exportToExcel(exportData);
          contentType = 'application/json'; // Return structure for frontend to handle
          filename = 'themes.xlsx';
          break;
        case 'pdf':
          result = await ExportService.exportToPDF(exportData);
          contentType = 'application/json'; // Return structure for frontend to handle
          filename = 'themes.pdf';
          break;
        default:
          return res.status(400).json({ message: "Unsupported export format" });
      }

      if (format === 'excel' || format === 'pdf') {
        // Return structured data for frontend processing
        res.json({ data: result, filename });
      } else {
        // Return file content directly
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(result);
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export data", error: error.message });
    }
  });

  // Get analysis settings
  app.get("/api/analysis-settings", async (req, res) => {
    try {
      const settings = await storage.getAnalysisSettings(DEFAULT_PROJECT_ID);
      res.json(settings || {
        painPoints: true,
        featureRequests: true,
        userBehaviors: false,
        emotions: false,
        themeCount: "5-7",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get analysis settings", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
