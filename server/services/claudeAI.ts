import Anthropic from "@anthropic-ai/sdk";
import { Quote } from "@shared/schema";

/*
Claude Haiku is cost-effective and well-suited for text analysis tasks like Sprint insight extraction.
Using Haiku for better cost efficiency as requested by user.
*/

// Using Claude Haiku for cost-effective analysis
const DEFAULT_MODEL_STR = "claude-3-haiku-20240307";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface SprintTheme {
  title: string;
  description?: string;
  quotes: Quote[];
  category: "opportunities" | "pain_points" | "ideas_hmws" | "generic";
  hmwQuestions?: string[];
  aiSuggestedSteps?: string[];
  color: string;
}

export interface AIPromptTemplate {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  description: string;
}

export class ClaudeSprintAI {
  // Customizable prompt templates for different Sprint contexts
  private static readonly PROMPT_TEMPLATES: {
    [key: string]: AIPromptTemplate;
  } = {
    expert_interviews: {
      name: "Expert Interviews Analysis",
      systemPrompt: `You are an expert Design Sprint facilitator analysing Day 2 expert interview transcripts. Your role is to extract actionable insights that will inform the Sprint team's decisions.

Extract insights and organise them into three categories:
1. OPPORTUNITIES - Market gaps, user needs, business opportunities the experts highlighted
2. PAIN POINTS - Problems, barriers, challenges experts identified 
3. MISC/OBSERVATIONS - Other observations, behaviours, patterns or ideas that don't fit into the above categories

Reference the sprint goal and questions to focus on relevant insights.

For each insight:
- Create a clear, actionable title that summarise the key idea (3-6 words)
- Provide a description explaining the insight's significance (10-25 words)
- Generate 2-3 "How Might We" questions focused on framing the problems to solve, or leverage opportunities rather than proposing specic solutions
- Include verbatim quotes that support this insight, do not make things up`,
      userPromptTemplate: `Analyse these expert interview transcripts for Sprint insights.

Sprint Goal: {{sprintGoal}}
Interview Context: Day 2 Expert Interviews - Industry experts sharing knowledge and insights

{{transcriptContent}}

CRITICAL: Return ONLY valid JSON with no additional text. Use this exact structure:
{
  "themes": [
    {
      "title": "Brief insight title",
      "description": "Detailed description explaining why this matters for the Sprint", 
      "category": "opportunities|pain_points|miscellaneous",
      "hmwQuestions": ["How might we leverage this opportunity?", "How might we solve this problem?"],
      "quotes": [{"text": "exact quote from transcript", "source": "Expert Name or Interview #", "transcriptId": 1}]
    }
  ]
}`,
      description:
        "Optimized for analyzing expert knowledge and industry insights from Day 2 interviews",
    },

    testing_notes: {
      name: "User Testing Analysis",
      systemPrompt: `You are an expert Design Sprint facilitator analyzing Day 4 user testing notes. Your role is to extract learning insights that will guide the Sprint team's next iteration decisions and answer the sprint goals and questions.

Extract insights and organize them into three categories:
1. WHAT WORKED - Features, interactions, or concepts that users responded well to
2. WHAT DIDN'T WORK - Usability issues, confusions, or failures users experienced
3. IDEAS/NEXT STEPS - Improvements, iterations, or new directions based on user feedback, based on the sprint goal and questions

For each insight:
- Create a clear, specific title focused on user behavior or feedback
- Describe what users actually did or said, not assumptions
- Generate practical next steps for iteration or future discovery questions 'What do we need to find out next'
- Include direct user quotes that demonstrate the finding`,
      userPromptTemplate: `Analyze these user testing notes for actionable insights.

Sprint Goal: {{sprintGoal}}
Testing Context: Day 4 User Testing - Real users interacting with prototype/solution

{{transcriptContent}}

CRITICAL: Return ONLY valid JSON with no additional text. Use this exact structure:
{
  "themes": [
    {
      "title": "Specific user behavior or feedback",
      "description": "What users actually did/said and what it means for the solution", 
      "category": "opportunities|pain_points|ideas_hmws",
      "hmwQuestions": ["How might we build on what worked?", "How might we fix what didn't work?"],
      "aiSuggestedSteps": ["Iterate the design based on this feedback", "Test this specific element further"],
      "quotes": [{"text": "exact user quote or behavior observation", "source": "User #/Session #", "transcriptId": 1}]
    }
  ]
}`,
      description:
        "Optimized for analyzing user testing sessions and prototype feedback",
    },

    general_research: {
      name: "General Research Analysis",
      systemPrompt: `You are an expert user researcher analyzing qualitative research data. Extract meaningful insights that can inform product and design decisions.

Organize insights into categories:
1. OPPORTUNITIES - Unmet needs, market gaps, positive signals
2. PAIN POINTS - Problems, frustrations, barriers users face
3. IDEAS/HMWS - Solutions, features, or "How Might We" questions

Focus on actionable insights that teams can act upon.`,
      userPromptTemplate: `Analyze this research content for key insights.

Research Goal: {{sprintGoal}}
Content Type: {{transcriptType}}

{{transcriptContent}}

Return JSON with this exact structure:
{
  "themes": [
    {
      "title": "Clear insight title",
      "description": "Detailed explanation of the insight", 
      "category": "opportunities|pain_points|ideas_hmws|generic",
      "hmwQuestions": ["How might we address this need?", "How might we solve this problem?"],
      "aiSuggestedSteps": ["Next step recommendation", "Follow-up research suggestion"],
      "quotes": [{"text": "supporting quote", "source": "source identifier", "transcriptId": 1}]
    }
  ]
}`,
      description:
        "General purpose analysis for various types of research content",
    },
  };

  static async extractSprintInsights(
    transcriptContent: string,
    transcriptType: "expert_interviews" | "testing_notes" = "expert_interviews",
    sprintGoal?: string,
    customTemplate?: string,
  ): Promise<SprintTheme[]> {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error(
          "Anthropic API key not configured. Please add your ANTHROPIC_API_KEY to environment variables.",
        );
      }

      // Select prompt template based on transcript type
      const template = customTemplate || transcriptType;
      const promptConfig =
        this.PROMPT_TEMPLATES[template] ||
        this.PROMPT_TEMPLATES.general_research;

      // Build the user prompt by replacing template variables
      const userPrompt = promptConfig.userPromptTemplate
        .replace("{{sprintGoal}}", sprintGoal || "Not specified")
        .replace("{{transcriptContent}}", transcriptContent)
        .replace("{{transcriptType}}", transcriptType);

      const response = await anthropic.messages.create({
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: `${promptConfig.systemPrompt}\n\n${userPrompt}`,
          },
        ],
        // Using Claude Haiku for cost-effective analysis
        model: DEFAULT_MODEL_STR,
      });

      const textContent = response.content.find(
        (block) => block.type === "text",
      );
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text content received from Claude");
      }

      // Extract and clean JSON response
      let jsonStr = textContent.text || '{"themes": []}';

      // Try to extract from code blocks first
      const jsonMatch =
        jsonStr.match(/```json\n([\s\S]*?)\n```/) ||
        jsonStr.match(/```\n([\s\S]*?)\n```/);

      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      // Clean up common JSON formatting issues
      jsonStr = jsonStr
        .trim()
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{\[,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*'([^']*)'/g, ': "$1"') // Replace single quotes with double quotes
        .replace(/\n\s*\n/g, "\n"); // Remove empty lines

      let result;
      try {
        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        console.error(
          "Raw response:",
          textContent.text.substring(0, 500) + "...",
        );
        console.error("Cleaned JSON:", jsonStr.substring(0, 500) + "...");

        // Fallback: return empty structure if JSON parsing fails
        result = { themes: [] };
      }

      return (
        result.themes?.map((theme: any) => ({
          ...theme,
          color: this.getCategoryColor(theme.category),
        })) || []
      );
    } catch (error) {
      console.error("Claude AI extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`AI analysis failed: ${errorMessage}`);
    }
  }

  // Get available prompt templates
  static getPromptTemplates(): { [key: string]: AIPromptTemplate } {
    return this.PROMPT_TEMPLATES;
  }

  // Add or update a custom prompt template
  static addCustomTemplate(key: string, template: AIPromptTemplate): void {
    this.PROMPT_TEMPLATES[key] = template;
  }

  // Generate a custom prompt based on user preferences
  static createCustomPrompt(
    focusAreas: string[],
    outputFormat: string,
    analysisDepth: "basic" | "detailed" | "comprehensive" = "detailed",
  ): AIPromptTemplate {
    const depthInstructions = {
      basic: "Provide concise, high-level insights with minimal detail.",
      detailed:
        "Provide thorough analysis with clear explanations and context.",
      comprehensive:
        "Provide in-depth analysis with extensive detail, multiple perspectives, and strategic implications.",
    };

    return {
      name: "Custom Analysis",
      systemPrompt: `You are an expert researcher analyzing qualitative data. Focus specifically on: ${focusAreas.join(", ")}. 
      
Analysis depth: ${depthInstructions[analysisDepth]}
      
Extract insights and organize them appropriately based on the content type and research goals.`,
      userPromptTemplate: `Analyze this content with focus on: ${focusAreas.join(", ")}

Research Goal: {{sprintGoal}}
Content: {{transcriptContent}}

${outputFormat}`,
      description: `Custom analysis focusing on: ${focusAreas.join(", ")}`,
    };
  }

  private static getCategoryColor(category: string): string {
    switch (category) {
      case "opportunities":
        return "#22c55e"; // green
      case "pain_points":
        return "#ef4444"; // red
      case "ideas_hmws":
        return "#eab308"; // yellow
      case "generic":
        return "#6b7280"; // gray
      default:
        return "#6b7280";
    }
  }
}
