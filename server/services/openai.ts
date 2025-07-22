import OpenAI from "openai";
import { ExtractedTheme, Quote, ThemeExtractionType } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class OpenAIService {
  private static readonly THEME_COLORS = [
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#ec4899", // pink
    "#eab308", // yellow
  ];

  static async extractThemes(request: ThemeExtractionType): Promise<ExtractedTheme[]> {
    const { transcripts, settings } = request;
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    if (transcripts.length === 0) {
      throw new Error("No transcripts provided for analysis");
    }

    try {
      const combinedText = transcripts.join('\n\n---\n\n');
      const prompt = this.buildExtractionPrompt(combinedText, settings);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert user researcher specializing in qualitative data analysis. You extract meaningful themes from user interview transcripts and identify supporting quotes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 4000,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return this.processExtractionResult(result, transcripts);
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error(`Failed to extract themes: ${error.message}`);
    }
  }

  private static buildExtractionPrompt(text: string, settings: any): string {
    const focusAreas = [];
    if (settings.painPoints) focusAreas.push("pain points and frustrations");
    if (settings.featureRequests) focusAreas.push("feature requests and suggestions");
    if (settings.userBehaviors) focusAreas.push("user behaviors and usage patterns");
    if (settings.emotions) focusAreas.push("emotional responses and feelings");

    const themeCountRange = settings.themeCount === "5-7" ? "5-7" : settings.themeCount === "8-10" ? "8-10" : "5-7";

    return `
Analyze the following user interview transcripts and extract ${themeCountRange} key themes. Focus on: ${focusAreas.join(", ")}.

For each theme, provide:
1. A clear, descriptive title (2-5 words)
2. A brief description (1-2 sentences)
3. 2-4 supporting quotes from the transcripts
4. The source identifier for each quote (e.g., "Interview #1", "Transcript A")

Return the results in this JSON format:
{
  "themes": [
    {
      "title": "Theme Title",
      "description": "Brief description of the theme",
      "quotes": [
        {
          "text": "Exact quote from transcript",
          "source": "Source identifier"
        }
      ]
    }
  ]
}

Interview Transcripts:
${text}

Important guidelines:
- Extract quotes verbatim from the transcripts
- Ensure themes are distinct and non-overlapping
- Focus on recurring patterns across multiple interviews
- Prioritize actionable insights for product teams
- Use clear, jargon-free language for theme titles
`;
  }

  private static processExtractionResult(result: any, transcripts: string[]): ExtractedTheme[] {
    if (!result.themes || !Array.isArray(result.themes)) {
      throw new Error("Invalid response format from OpenAI");
    }

    return result.themes.map((theme: any, index: number) => {
      // Assign colors cyclically
      const color = this.THEME_COLORS[index % this.THEME_COLORS.length];

      // Process quotes
      const quotes: Quote[] = (theme.quotes || []).map((quote: any, quoteIndex: number) => ({
        text: quote.text || "",
        source: quote.source || `Source ${quoteIndex + 1}`,
        transcriptId: this.findTranscriptId(quote.text, transcripts),
      }));

      return {
        title: theme.title || `Theme ${index + 1}`,
        description: theme.description || "",
        quotes,
        color,
      };
    });
  }

  private static findTranscriptId(quoteText: string, transcripts: string[]): number {
    // Find which transcript contains this quote
    for (let i = 0; i < transcripts.length; i++) {
      if (transcripts[i].includes(quoteText)) {
        return i + 1; // Use 1-based indexing for display
      }
    }
    return 1; // Default to first transcript if not found
  }

  static async refineTheme(themeTitle: string, quotes: Quote[], context: string): Promise<{ title: string; description: string }> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      const prompt = `
Based on the following quotes and context, refine this theme:

Current Theme: "${themeTitle}"

Supporting Quotes:
${quotes.map(q => `- "${q.text}" (${q.source})`).join('\n')}

Context: ${context}

Provide a refined theme title and description in JSON format:
{
  "title": "Refined theme title (2-5 words)",
  "description": "Clear description of what this theme represents (1-2 sentences)"
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a UX research expert helping to refine theme analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        title: result.title || themeTitle,
        description: result.description || "",
      };
    } catch (error) {
      console.error("OpenAI refinement error:", error);
      // Return original values on error
      return {
        title: themeTitle,
        description: "",
      };
    }
  }
}
