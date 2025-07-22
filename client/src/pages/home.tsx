import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Brain, Settings, Download, FileText, Upload, MoreHorizontal, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import FileUpload from "@/components/FileUpload";
import TextInput from "@/components/TextInput";
import AnalysisControls from "@/components/AnalysisControls";
import ThemeGrid from "@/components/ThemeGrid";
import ExportSection from "@/components/ExportSection";
import { Theme, Transcript, Project } from "@shared/schema";

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'input' | 'themes'>('input');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/project"],
  });

  const { data: themes = [], refetch: refetchThemes } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: transcripts = [], refetch: refetchTranscripts } = useQuery<Transcript[]>({
    queryKey: ["/api/transcripts"],
  });

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false);
    refetchThemes();
    setCurrentStep('themes');
  };

  const handleTextAdded = () => {
    refetchTranscripts();
  };

  const handleUploadComplete = () => {
    refetchTranscripts();
    setIsUploadModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Brain className="text-white w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">ThemeSync</h1>
                <p className="text-xs text-slate-600">AI-powered theme extraction for user research</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Process Timeline */}
        <div className="flex items-center justify-start mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentStep('input')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 'input' || themes.length === 0
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="font-medium">Research Input</span>
            </button>
            <div className={`w-8 h-0.5 ${themes.length > 0 ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
            <button
              onClick={() => themes.length > 0 && setCurrentStep('themes')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 'themes' && themes.length > 0
                  ? 'bg-blue-100 text-blue-700'
                  : themes.length > 0
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={themes.length === 0}
            >
              <Brain className="w-4 h-4" />
              <span className="font-medium">Extracted Themes</span>
            </button>
          </div>
        </div>

        {/* Content based on current step */}
        {currentStep === 'input' && (
          <div className="space-y-8">
            {/* Main Text Input */}
            <TextInput 
              onAnalysisComplete={handleAnalysisComplete}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />


          </div>
        )}

        {currentStep === 'themes' && themes.length > 0 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Extracted Themes</h2>
                <p className="text-slate-600 mt-1">{themes.length} themes identified from your research data</p>
              </div>
            </div>
            <ThemeGrid themes={themes} onThemeUpdate={refetchThemes} />
            <ExportSection disabled={themes.length === 0} />
          </div>
        )}

        {/* Progress Indicator */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">Analyzing your research data...</h3>
                  <p className="text-sm text-slate-600 mt-1">Our AI is identifying themes and extracting supporting quotes</p>
                  <div className="mt-3 bg-slate-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-500"></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Processing transcripts... 75% complete</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
