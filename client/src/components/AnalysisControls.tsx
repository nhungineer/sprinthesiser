import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AnalysisControlsProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: () => void;
  disabled?: boolean;
  compact?: boolean;
}

interface AnalysisSettings {
  painPoints: boolean;
  featureRequests: boolean;
  userBehaviors: boolean;
  emotions: boolean;
  themeCount: string;
}

export default function AnalysisControls({ 
  onAnalysisStart, 
  onAnalysisComplete, 
  disabled = false,
  compact = false
}: AnalysisControlsProps) {
  const { toast } = useToast();
  
  const { data: defaultSettings } = useQuery({
    queryKey: ["/api/analysis-settings"],
  });

  const [settings, setSettings] = useState<AnalysisSettings>({
    painPoints: true,
    featureRequests: true,
    userBehaviors: false,
    emotions: false,
    themeCount: "5-7",
    ...defaultSettings,
  });

  const extractThemesMutation = useMutation({
    mutationFn: async (analysisSettings: AnalysisSettings) => {
      const response = await apiRequest('POST', '/api/extract-themes', {
        transcripts: [], // Will be handled by backend
        settings: analysisSettings,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `${data.themes.length} themes extracted successfully`,
      });
      onAnalysisComplete();
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
      onAnalysisComplete();
    },
  });

  const handleAnalyze = () => {
    onAnalysisStart();
    extractThemesMutation.mutate(settings);
  };

  const updateSetting = (key: keyof AnalysisSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (compact) {
    return (
      <Button
        onClick={handleAnalyze}
        disabled={disabled || extractThemesMutation.isPending}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-medium"
        size="lg"
      >
        <Wand2 className="w-5 h-5 mr-2" />
        {extractThemesMutation.isPending ? "Analyzing..." : "Analyze Themes"}
      </Button>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">AI Theme Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.painPoints}
                  onCheckedChange={(checked) => updateSetting('painPoints', !!checked)}
                />
                <span className="text-slate-700">Pain Points</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.featureRequests}
                  onCheckedChange={(checked) => updateSetting('featureRequests', !!checked)}
                />
                <span className="text-slate-700">Feature Requests</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.userBehaviors}
                  onCheckedChange={(checked) => updateSetting('userBehaviors', !!checked)}
                />
                <span className="text-slate-700">User Behaviors</span>
              </label>
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={settings.emotions}
                  onCheckedChange={(checked) => updateSetting('emotions', !!checked)}
                />
                <span className="text-slate-700">Emotions</span>
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Select
              value={settings.themeCount}
              onValueChange={(value) => updateSetting('themeCount', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-7">5-7 themes</SelectItem>
                <SelectItem value="8-10">8-10 themes</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleAnalyze}
              disabled={disabled || extractThemesMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              {extractThemesMutation.isPending ? "Analyzing..." : "Analyze Themes"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
