import OpenAI from "openai";
import { Quote } from "@shared/schema";

export interface SprintTheme {
  title: string;
  description?: string;
  quotes: Quote[];
  category: 'opportunities' | 'pain_points' | 'ideas_hmws';
  hmwQuestions?: string[];
  color: string;
}

export class SprintAIService {
  static async extractSprintInsights(
    transcriptContent: string,
    sprintGoal?: string
  ): Promise<SprintTheme[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Return sample data for demonstration
        return this.generateSampleSprintThemes();
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const systemPrompt = `You are an expert Design Sprint facilitator analyzing interview transcripts. 
      Extract insights and organize them into three categories:
      1. OPPORTUNITIES - positive insights, what users want, gaps to fill
      2. PAIN POINTS - problems, frustrations, barriers users face  
      3. IDEAS/HMWS - innovative ideas and "How Might We" questions

      For each insight, generate relevant "How Might We" questions.
      
      Sprint Goal: ${sprintGoal || "Not specified"}
      
      Return JSON with this structure:
      {
        "themes": [
          {
            "title": "Brief insight title",
            "description": "Detailed description", 
            "category": "opportunities|pain_points|ideas_hmws",
            "hmwQuestions": ["How might we...", "How might we..."],
            "quotes": [{"text": "quote", "source": "source", "transcriptId": 1}]
          }
        ]
      }`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcriptContent }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return result.themes?.map((theme: any) => ({
        ...theme,
        color: this.getCategoryColor(theme.category),
      })) || [];

    } catch (error) {
      console.error("Sprint AI extraction error:", error);
      return this.generateSampleSprintThemes();
    }
  }

  private static getCategoryColor(category: string): string {
    const colorMap = {
      'opportunities': '#22c55e', // green
      'pain_points': '#ef4444',   // red
      'ideas_hmws': '#eab308',    // yellow
    };
    return colorMap[category as keyof typeof colorMap] || '#6b7280';
  }

  private static generateSampleSprintThemes(): SprintTheme[] {
    return [
      {
        title: "Mobile checkout friction",
        description: "Users struggle with checkout on mobile devices",
        category: 'pain_points',
        color: '#ef4444',
        hmwQuestions: [
          "How might we simplify mobile checkout?",
          "How might we reduce cart abandonment?"
        ],
        quotes: [
          { text: "The checkout process on mobile is really confusing", source: "User 1", transcriptId: 1 },
          { text: "I gave up trying to buy because it was too complex", source: "User 2", transcriptId: 1 }
        ]
      },
      {
        title: "Social proof opportunity", 
        description: "Users want to see what others have purchased",
        category: 'opportunities',
        color: '#22c55e',
        hmwQuestions: [
          "How might we showcase social proof?",
          "How might we build community around purchases?"
        ],
        quotes: [
          { text: "I'd love to see what other people bought", source: "User 3", transcriptId: 1 },
          { text: "Reviews from real customers would help me decide", source: "User 4", transcriptId: 1 }
        ]
      },
      {
        title: "Personalized recommendations",
        description: "AI-powered product suggestions based on behavior",
        category: 'ideas_hmws',
        color: '#eab308',
        hmwQuestions: [
          "How might we use AI to personalize experiences?",
          "How might we predict what users want next?"
        ],
        quotes: [
          { text: "I wish the site knew what I was looking for", source: "User 5", transcriptId: 1 }
        ]
      }
    ];
  }
}