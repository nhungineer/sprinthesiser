import { Theme } from "@shared/schema";

export interface ExportData {
  themes: Theme[];
  transcriptType: 'expert_interviews' | 'testing_notes';
  sprintGoal?: string;
  exportDate: string;
  voteCounts?: { [key: string]: number };
}

export class ExportService {
  static generateTextExport(data: ExportData): string {
    const { themes, transcriptType, sprintGoal, exportDate, voteCounts = {} } = data;
    
    let output = `SPRINT INSIGHTS EXPORT\n`;
    output += `Generated: ${exportDate}\n`;
    if (sprintGoal) {
      output += `Sprint Goal: ${sprintGoal}\n`;
    }
    output += `Transcript Type: ${transcriptType === 'expert_interviews' ? 'Expert Interviews' : 'Testing Notes'}\n`;
    output += `Total Insights: ${themes.length}\n\n`;
    output += `${'='.repeat(50)}\n\n`;

    themes.forEach((theme, index) => {
      // Insight Type
      const categoryLabel = this.getCategoryLabel(theme.category, transcriptType);
      output += `${index + 1}. ${categoryLabel.toUpperCase()}\n\n`;
      
      // Insight Heading
      output += `${theme.title}\n`;
      if (theme.description) {
        output += `${theme.description}\n`;
      }
      
      // Vote count if available
      const themeVotes = voteCounts[`theme-${theme.id}`];
      if (themeVotes > 0) {
        output += `VOTES: ${themeVotes}\n`;
      }
      output += `\n`;

      // Quotes
      if (theme.quotes && theme.quotes.length > 0) {
        output += `QUOTES:\n`;
        theme.quotes.forEach(quote => {
          output += `- "${quote.text}" - ${quote.source}\n`;
        });
        output += `\n`;
      }

      // AI Suggestions
      const hasSuggestions = (theme.hmwQuestions && theme.hmwQuestions.length > 0) || 
                           (theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0);
      
      if (hasSuggestions) {
        const suggestionLabel = transcriptType === 'expert_interviews' ? 'HMW QUESTIONS' : 'NEXT STEPS';
        output += `AI SUGGESTIONS (${suggestionLabel}):\n`;
        
        if (theme.hmwQuestions && theme.hmwQuestions.length > 0) {
          theme.hmwQuestions.forEach((hmw, idx) => {
            const votes = voteCounts[`theme-${theme.id}-hmw-${idx}`];
            const voteText = votes > 0 ? ` (${votes} votes)` : '';
            output += `- ${hmw}${voteText}\n`;
          });
        }
        
        if (theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0) {
          theme.aiSuggestedSteps.forEach((step, idx) => {
            const votes = voteCounts[`theme-${theme.id}-ai_step-${idx}`];
            const voteText = votes > 0 ? ` (${votes} votes)` : '';
            output += `- ${step}${voteText}\n`;
          });
        }
        output += `\n`;
      }

      output += `${'-'.repeat(30)}\n\n`;
    });

    return output;
  }

  static generateMarkdownExport(data: ExportData): string {
    const { themes, transcriptType, sprintGoal, exportDate } = data;
    
    let output = `# Sprint Insights Export\n\n`;
    output += `**Generated:** ${exportDate}  \n`;
    if (sprintGoal) {
      output += `**Sprint Goal:** ${sprintGoal}  \n`;
    }
    output += `**Transcript Type:** ${transcriptType === 'expert_interviews' ? 'Expert Interviews' : 'Testing Notes'}  \n`;
    output += `**Total Insights:** ${themes.length}\n\n`;
    output += `---\n\n`;

    themes.forEach((theme, index) => {
      // Insight Type
      const categoryLabel = this.getCategoryLabel(theme.category, transcriptType);
      output += `## ${index + 1}. ${categoryLabel}\n\n`;
      
      // Insight Heading
      output += `### ${theme.title}\n\n`;
      if (theme.description) {
        output += `${theme.description}\n\n`;
      }

      // Quotes
      if (theme.quotes && theme.quotes.length > 0) {
        output += `#### Quotes\n\n`;
        theme.quotes.forEach(quote => {
          output += `> "${quote.text}" — *${quote.source}*\n\n`;
        });
      }

      // AI Suggestions
      const hasSuggestions = (theme.hmwQuestions && theme.hmwQuestions.length > 0) || 
                           (theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0);
      
      if (hasSuggestions) {
        const suggestionLabel = transcriptType === 'expert_interviews' ? 'HMW Questions' : 'Next Steps';
        output += `#### AI Suggestions (${suggestionLabel})\n\n`;
        
        if (theme.hmwQuestions && theme.hmwQuestions.length > 0) {
          theme.hmwQuestions.forEach(hmw => {
            output += `- ${hmw}\n`;
          });
          output += `\n`;
        }
        
        if (theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0) {
          theme.aiSuggestedSteps.forEach(step => {
            output += `- ${step}\n`;
          });
          output += `\n`;
        }
      }

      output += `---\n\n`;
    });

    return output;
  }

  static generateCSVExport(data: ExportData): string {
    const { themes, transcriptType, exportDate, voteCounts = {} } = data;
    
    // CSV Headers
    let csv = 'Insight Heading,Type,Vote Count,Raw Quotes,AI Suggestions,Source,Date and Time of Synthesis\n';
    
    themes.forEach(theme => {
      const categoryLabel = this.getCategoryLabel(theme.category, transcriptType);
      const heading = this.escapeCSV(theme.title);
      const type = this.escapeCSV(categoryLabel);
      
      // Vote count for the theme
      const themeVotes = voteCounts[`theme-${theme.id}`] || 0;
      
      // Combine all quotes
      const quotes = theme.quotes?.map(q => `"${q.text}" - ${q.source}`).join('; ') || '';
      const quotesEscaped = this.escapeCSV(quotes);
      
      // Combine all AI suggestions with vote counts
      const hmwSuggestions = (theme.hmwQuestions || []).map((hmw, idx) => {
        const votes = voteCounts[`theme-${theme.id}-hmw-${idx}`];
        return votes > 0 ? `${hmw} (${votes} votes)` : hmw;
      });
      
      const stepSuggestions = (theme.aiSuggestedSteps || []).map((step, idx) => {
        const votes = voteCounts[`theme-${theme.id}-ai_step-${idx}`];
        return votes > 0 ? `${step} (${votes} votes)` : step;
      });
      
      const suggestions = [...hmwSuggestions, ...stepSuggestions].join('; ');
      const suggestionsEscaped = this.escapeCSV(suggestions);
      
      // Sources (unique)
      const sources = Array.from(new Set(theme.quotes?.map(q => q.source) || [])).join('; ');
      const sourcesEscaped = this.escapeCSV(sources);
      
      csv += `${heading},${type},${themeVotes},${quotesEscaped},${suggestionsEscaped},${sourcesEscaped},${exportDate}\n`;
    });
    
    return csv;
  }

  private static getCategoryLabel(category: string, transcriptType: 'expert_interviews' | 'testing_notes'): string {
    if (transcriptType === 'expert_interviews') {
      switch (category) {
        case 'opportunities': return 'Opportunities';
        case 'pain_points': return 'Pain Points';
        case 'ideas_hmws': return 'Ideas';
        case 'generic': return 'Generic';
        default: return 'Other';
      }
    } else {
      switch (category) {
        case 'opportunities': return 'What Worked';
        case 'pain_points': return "What Didn't Work";
        case 'ideas_hmws': return 'Ideas/Next Steps';
        case 'generic': return 'Generic';
        default: return 'Other';
      }
    }
  }

  private static escapeCSV(value: string): string {
    if (!value) return '""';
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    const escaped = value.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      return `"${escaped}"`;
    }
    return `"${escaped}"`;
  }
}