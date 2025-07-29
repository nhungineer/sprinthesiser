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
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Sprint Analysis Overview</h3>
        <Badge variant="outline" className="bg-white">
          <Clock className="w-3 h-3 mr-1" />
          {formatTime(processingTime)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full mx-auto mb-2">
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{themes.length}</p>
          <p className="text-xs text-gray-600">Themes</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full mx-auto mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-green-600">{totalQuotes}</p>
          <p className="text-xs text-gray-600">Quotes</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-yellow-600 text-white rounded-full mx-auto mb-2">
            <Lightbulb className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">{totalHMWs}</p>
          <p className="text-xs text-gray-600">HMWs</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full mx-auto mb-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalAISuggestions}</p>
          <p className="text-xs text-gray-600">AI Steps</p>
        </div>
      </div>
    </Card>
  );
}