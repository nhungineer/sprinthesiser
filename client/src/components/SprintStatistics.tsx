import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Theme } from "@shared/schema";
import { Clock, FileText, Lightbulb } from "lucide-react";

interface SprintStatisticsProps {
  themes: Theme[];
  processingTime?: number; // in seconds
}

export function SprintStatistics({ themes, processingTime = 0 }: SprintStatisticsProps) {
  const totalQuotes = themes.reduce((sum, theme) => sum + (theme.quotes?.length || 0), 0);
  const totalHMWs = themes.reduce((sum, theme) => sum + (theme.hmwQuestions?.length || 0), 0);
  const totalAISuggestions = themes.reduce((sum, theme) => sum + (theme.aiSuggestedSteps?.length || 0), 0);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{themes.length}</span>
            <span className="text-sm text-gray-600">themes</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-lg font-bold text-green-600">{totalQuotes}</span>
            <span className="text-sm text-gray-600">quotes</span>
          </div>
          
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-bold text-purple-600">{totalHMWs + totalAISuggestions}</span>
            <span className="text-sm text-gray-600">AI suggestions</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm">{formatTime(processingTime)} taken</span>
        </div>
      </div>
    </Card>
  );
}