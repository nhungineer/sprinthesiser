import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, Table, Image, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import html2canvas from "html2canvas";

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transcriptType: 'expert_interviews' | 'testing_notes';
  sprintGoal?: string;
  voteCounts?: { [key: string]: number };
}

export function ExportModal({ isOpen, onOpenChange, transcriptType, sprintGoal, voteCounts }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>("");

  const handleTextExport = async (format: 'txt' | 'md' | 'doc') => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          transcriptType,
          sprintGoal,
          voteCounts
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint-insights-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcriptType,
          sprintGoal,
          voteCounts
        }),
      });

      if (!response.ok) {
        throw new Error('CSV export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint-insights-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('CSV export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImageExport = async () => {
    setIsExporting(true);
    try {
      // Find the insights container
      const insightsContainer = document.querySelector('[data-export-target="insights"]') as HTMLElement;
      if (!insightsContainer) {
        throw new Error('Insights container not found');
      }

      // Temporarily show all hover content for screenshot
      const hoverElements = insightsContainer.querySelectorAll('[data-hover-content]');
      hoverElements.forEach(el => {
        (el as HTMLElement).style.display = 'block';
        (el as HTMLElement).style.visibility = 'visible';
        (el as HTMLElement).style.opacity = '1';
      });

      // Generate screenshot
      const canvas = await html2canvas(insightsContainer, {
        backgroundColor: '#f9fafb',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: insightsContainer.scrollHeight,
        width: insightsContainer.scrollWidth
      });

      // Restore original display
      hoverElements.forEach(el => {
        (el as HTMLElement).style.display = '';
        (el as HTMLElement).style.visibility = '';
        (el as HTMLElement).style.opacity = '';
      });

      // Download image
      const link = document.createElement('a');
      link.download = `sprint-insights-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Image export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Sprint Insights</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4">
          {/* Text Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Text Export
              </CardTitle>
              <CardDescription>
                Export summarized insights with headings, quotes, and AI suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleTextExport('txt')}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  TXT
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleTextExport('md')}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Markdown
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleTextExport('doc')}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  DOC
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CSV Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                CSV Export
              </CardTitle>
              <CardDescription>
                Structured data with columns: Insight Heading, Type, Raw Quotes, AI Suggestions, Source, Date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleCSVExport}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Export CSV
              </Button>
            </CardContent>
          </Card>

          {/* Image Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Image Export
              </CardTitle>
              <CardDescription>
                PNG screenshot of all sprint insight cards with expanded quotes and suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={handleImageExport}
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Export PNG
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}