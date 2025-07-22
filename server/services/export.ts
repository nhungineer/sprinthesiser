import { Theme, Project, Transcript } from "@shared/schema";

export interface ExportData {
  project: Project;
  themes: Theme[];
  transcripts: Transcript[];
}

export class ExportService {
  static async exportToJSON(data: ExportData): Promise<string> {
    const exportObject = {
      project: {
        name: data.project.name,
        description: data.project.description,
        createdAt: data.project.createdAt,
      },
      summary: {
        totalThemes: data.themes.length,
        totalTranscripts: data.transcripts.length,
        totalQuotes: data.themes.reduce((sum, theme) => sum + theme.quotes.length, 0),
      },
      themes: data.themes.map(theme => ({
        title: theme.title,
        description: theme.description,
        color: theme.color,
        quotes: theme.quotes,
        createdAt: theme.createdAt,
      })),
      transcripts: data.transcripts.map(transcript => ({
        filename: transcript.filename,
        fileType: transcript.fileType,
        uploadedAt: transcript.uploadedAt,
      })),
    };

    return JSON.stringify(exportObject, null, 2);
  }

  static async exportToCSV(data: ExportData): Promise<string> {
    const headers = ["Theme", "Description", "Quote", "Source", "Transcript"];
    const rows = [headers.join(",")];

    data.themes.forEach(theme => {
      theme.quotes.forEach(quote => {
        const transcript = data.transcripts.find(t => t.id === quote.transcriptId);
        const row = [
          this.escapeCsvField(theme.title),
          this.escapeCsvField(theme.description || ""),
          this.escapeCsvField(quote.text),
          this.escapeCsvField(quote.source),
          this.escapeCsvField(transcript?.filename || "Unknown"),
        ];
        rows.push(row.join(","));
      });
    });

    return rows.join("\n");
  }

  static async exportToExcel(data: ExportData): Promise<any> {
    // This would use a library like ExcelJS in production
    // For now, return structured data that could be converted to Excel
    return {
      worksheets: [
        {
          name: "Themes Summary",
          data: data.themes.map(theme => ({
            "Theme Title": theme.title,
            "Description": theme.description || "",
            "Color": theme.color,
            "Quote Count": theme.quotes.length,
            "Created": theme.createdAt.toISOString(),
          }))
        },
        {
          name: "Detailed Quotes",
          data: data.themes.flatMap(theme =>
            theme.quotes.map(quote => {
              const transcript = data.transcripts.find(t => t.id === quote.transcriptId);
              return {
                "Theme": theme.title,
                "Quote": quote.text,
                "Source": quote.source,
                "Transcript": transcript?.filename || "Unknown",
                "File Type": transcript?.fileType || "Unknown",
              };
            })
          )
        }
      ]
    };
  }

  static async exportToPDF(data: ExportData): Promise<any> {
    // This would use a library like jsPDF in production
    // For now, return structured data for PDF generation
    return {
      title: data.project.name || "Theme Analysis Report",
      subtitle: data.project.description || "",
      createdAt: new Date().toISOString(),
      summary: {
        totalThemes: data.themes.length,
        totalTranscripts: data.transcripts.length,
        totalQuotes: data.themes.reduce((sum, theme) => sum + theme.quotes.length, 0),
      },
      sections: data.themes.map(theme => ({
        title: theme.title,
        description: theme.description || "",
        color: theme.color,
        quotes: theme.quotes.map(quote => ({
          text: quote.text,
          source: quote.source,
        })),
      })),
    };
  }

  private static escapeCsvField(field: string): string {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }
}
