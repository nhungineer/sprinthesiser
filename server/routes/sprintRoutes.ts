import { Express } from "express";
import { ClaudeSprintAI } from "../services/claudeAI";
import { storage } from "../storage";

const DEFAULT_PROJECT_ID = 1;

export function setupSprintRoutes(app: Express) {
  // Sprint AI analysis endpoint
  app.post("/api/sprint/analyze", async (req, res) => {
    try {
      const { transcriptContent, transcriptType = 'expert_interviews', sprintGoal } = req.body;
      
      if (!transcriptContent || transcriptContent.trim().length === 0) {
        return res.status(400).json({ message: "Transcript content is required" });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(400).json({ 
          message: "AI analysis not available", 
          error: "Anthropic API key not configured" 
        });
      }

      // Clear existing themes first
      const existingThemes = await storage.getThemesByProject(DEFAULT_PROJECT_ID);
      for (const theme of existingThemes) {
        await storage.deleteTheme(theme.id);
      }

      // Use Claude AI to extract Sprint insights
      const extractedThemes = await ClaudeSprintAI.extractSprintInsights(
        transcriptContent,
        transcriptType,
        sprintGoal
      );

      // Store themes in database
      const storedThemes = [];
      for (let i = 0; i < extractedThemes.length; i++) {
        const theme = extractedThemes[i];
        const storedTheme = await storage.createTheme({
          projectId: DEFAULT_PROJECT_ID,
          title: theme.title,
          description: theme.description || '',
          color: theme.color,
          quotes: theme.quotes || [],
          category: theme.category,
          position: i,
          hmwQuestions: theme.hmwQuestions || [],
          aiSuggestedSteps: theme.aiSuggestedSteps || [],
        });
        storedThemes.push(storedTheme);
      }

      res.json({ 
        message: "Analysis completed successfully", 
        themes: storedThemes,
        count: storedThemes.length
      });
    } catch (error) {
      console.error("Sprint analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "AI analysis failed", error: errorMessage });
    }
  });

  // Get available prompt templates
  app.get("/api/sprint/templates", async (req, res) => {
    try {
      const templates = ClaudeSprintAI.getPromptTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Template retrieval error:", error);
      res.status(500).json({ 
        message: "Failed to get templates", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Edit HMW question or AI step
  app.patch("/api/themes/:themeId/items/:itemType/:itemIndex", async (req, res) => {
    try {
      const { themeId, itemType, itemIndex } = req.params;
      const { newValue } = req.body;

      if (!newValue || !newValue.trim()) {
        return res.status(400).json({ message: "New value is required" });
      }

      const theme = await storage.getTheme(parseInt(themeId));
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      const index = parseInt(itemIndex);
      
      if (itemType === 'hmw' && theme.hmwQuestions) {
        if (index >= 0 && index < theme.hmwQuestions.length) {
          theme.hmwQuestions[index] = newValue.trim();
          await storage.updateTheme(theme.id, { hmwQuestions: theme.hmwQuestions });
        } else {
          return res.status(400).json({ message: "Invalid HMW question index" });
        }
      } else if (itemType === 'step' && theme.aiSuggestedSteps) {
        if (index >= 0 && index < theme.aiSuggestedSteps.length) {
          theme.aiSuggestedSteps[index] = newValue.trim();
          await storage.updateTheme(theme.id, { aiSuggestedSteps: theme.aiSuggestedSteps });
        } else {
          return res.status(400).json({ message: "Invalid AI step index" });
        }
      } else {
        return res.status(400).json({ message: "Invalid item type" });
      }

      res.json({ message: "Item updated successfully" });
    } catch (error) {
      console.error("Item edit error:", error);
      res.status(500).json({ 
        message: "Failed to edit item", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Delete HMW question or AI step
  app.delete("/api/themes/:themeId/items/:itemType/:itemIndex", async (req, res) => {
    try {
      const { themeId, itemType, itemIndex } = req.params;

      const theme = await storage.getTheme(parseInt(themeId));
      if (!theme) {
        return res.status(404).json({ message: "Theme not found" });
      }

      const index = parseInt(itemIndex);
      
      if (itemType === 'hmw' && theme.hmwQuestions) {
        if (index >= 0 && index < theme.hmwQuestions.length) {
          theme.hmwQuestions.splice(index, 1);
          await storage.updateTheme(theme.id, { hmwQuestions: theme.hmwQuestions });
        } else {
          return res.status(400).json({ message: "Invalid HMW question index" });
        }
      } else if (itemType === 'step' && theme.aiSuggestedSteps) {
        if (index >= 0 && index < theme.aiSuggestedSteps.length) {
          theme.aiSuggestedSteps.splice(index, 1);
          await storage.updateTheme(theme.id, { aiSuggestedSteps: theme.aiSuggestedSteps });
        } else {
          return res.status(400).json({ message: "Invalid AI step index" });
        }
      } else {
        return res.status(400).json({ message: "Invalid item type" });
      }

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Item delete error:", error);
      res.status(500).json({ 
        message: "Failed to delete item", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}