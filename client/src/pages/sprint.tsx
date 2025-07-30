import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Plus, Vote, Download, X } from "lucide-react";
import { Project, Theme, Quote, VotingSession as VotingSessionType } from "@shared/schema";
import { TranscriptModal } from "@/components/TranscriptModal";
import { queryClient } from "@/lib/queryClient";
import { EnhancedThemeCard } from "@/components/EnhancedThemeCard";
import { SprintStatistics } from "@/components/SprintStatistics";
import { SprintFilters, FilterState } from "@/components/SprintFilters";
import { ExportModal } from "@/components/ExportModal";
import { VotingModal } from "@/components/VotingModal";
import { VotingSession } from "@/components/VotingSession";

export default function SprintPage() {
  const [sprintGoal, setSprintGoal] = useState("");
  const [contextFields, setContextFields] = useState<string[]>([]);
  const [transcriptContent, setTranscriptContent] = useState("");
  const [transcriptType, setTranscriptType] = useState<'expert_interviews' | 'testing_notes'>('expert_interviews');
  const [currentStep, setCurrentStep] = useState<'context' | 'transcript' | 'insights'>('context');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    category: 'all',
  });
  const [processingTime, setProcessingTime] = useState(0);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [activeVotingSession, setActiveVotingSession] = useState<VotingSessionType | null>(null);

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/project"],
  });

  const { data: themes = [], refetch: refetchThemes } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
  });

  const { data: activeSession } = useQuery<VotingSessionType | null>({
    queryKey: ['/api/voting/sessions/1/active'],
    enabled: currentStep === 'insights',
    refetchInterval: 5000, // Poll every 5s for real-time updates
  });

  const synthesizeMutation = useMutation({
    mutationFn: async ({ content, sprintGoal }: { content: string; sprintGoal: string }) => {
      const response = await fetch('/api/sprint/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sprintGoal }),
      });
      if (!response.ok) {
        throw new Error('Failed to synthesize insights');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      setCurrentStep('insights');
      setIsAnalyzing(false);
    },
    onError: (error) => {
      console.error('Synthesis error:', error);
      setIsAnalyzing(false);
    },
  });

  const handleContextSubmit = () => {
    setCurrentStep('transcript');
  };

  const addContextField = () => {
    setContextFields([...contextFields, ""]);
  };

  const removeContextField = (index: number) => {
    setContextFields(contextFields.filter((_, i) => i !== index));
  };

  const updateContextField = (index: number, value: string) => {
    const updated = [...contextFields];
    updated[index] = value;
    setContextFields(updated);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setTranscriptContent(content);
      };
      reader.readAsText(file);
    }
  };

  const handleSynthesize = async () => {
    if (!transcriptContent.trim()) return;
    
    const startTime = Date.now();
    setIsAnalyzing(true);
    setProcessingTime(0);
    
    synthesizeMutation.mutate({ 
      content: transcriptContent, 
      sprintGoal: sprintGoal 
    });
  };



  const handleViewTranscript = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowTranscriptModal(true);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const filterThemes = (themes: Theme[]) => {
    return themes.filter(theme => {
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const titleMatch = theme.title.toLowerCase().includes(searchLower);
        const descMatch = theme.description?.toLowerCase().includes(searchLower);
        const quotesMatch = theme.quotes?.some(q => q.text.toLowerCase().includes(searchLower));
        const hmwMatch = theme.hmwQuestions?.some(h => h.toLowerCase().includes(searchLower));
        const aiMatch = theme.aiSuggestedSteps?.some(s => s.toLowerCase().includes(searchLower));
        
        if (!titleMatch && !descMatch && !quotesMatch && !hmwMatch && !aiMatch) {
          return false;
        }
      }

      // Category filter
      if (filters.category !== 'all' && theme.category !== filters.category) {
        return false;
      }

      return true;
    });
  };

  const renderInsightCategories = () => {
    const filteredThemes = filterThemes(themes);
    const opportunities = filteredThemes.filter(t => t.category === 'opportunities');
    const painPoints = filteredThemes.filter(t => t.category === 'pain_points');
    const ideasHmws = filteredThemes.filter(t => t.category === 'ideas_hmws');
    const generic = filteredThemes.filter(t => t.category === 'generic');

    return (
      <div className="flex-1 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-gray-800">SPRINT INSIGHTS</h2>
            <p className="text-sm lg:text-base text-gray-600">AI-powered synthesis assistant for Google Design Sprints.</p>
          </div>
        </div>
        
        {/* Statistics Overview */}
        <SprintStatistics themes={themes} processingTime={processingTime} />
        
        {/* Active Voting Session */}
        {activeSession?.isActive && (
          <VotingSession
            session={activeSession}
            onSessionEnd={() => {
              setActiveVotingSession(null);
              queryClient.invalidateQueries({ queryKey: ['/api/voting/sessions/1/active'] });
            }}
          />
        )}

        {/* Filters */}
        <SprintFilters onFilterChange={handleFilterChange} transcriptType={transcriptType} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-export-target="insights">
          {/* Opportunities */}
          <div className="space-y-4">
            <div className="bg-green-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center justify-between">
              <span>{transcriptType === 'expert_interviews' ? 'OPPORTUNITIES' : 'WHAT WORKED'}</span>
              <span className="bg-green-700 px-2 py-1 rounded text-xs">{opportunities.length}</span>
            </div>
            <div className="space-y-3">
              {opportunities.map((theme) => (
                <EnhancedThemeCard
                  key={theme.id}
                  theme={theme}
                  transcriptType={transcriptType}
                  onViewTranscript={handleViewTranscript}
                  transcriptContent={transcriptContent}
                />
              ))}
              {opportunities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No opportunities found</p>
                </div>
              )}
            </div>
          </div>

          {/* Pain Points */}
          <div className="space-y-4">
            <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center justify-between">
              <span>{transcriptType === 'expert_interviews' ? 'PAIN POINTS' : "DIDN'T WORK"}</span>
              <span className="bg-red-700 px-2 py-1 rounded text-xs">{painPoints.length}</span>
            </div>
            <div className="space-y-3">
              {painPoints.map((theme) => (
                <EnhancedThemeCard
                  key={theme.id}
                  theme={theme}
                  transcriptType={transcriptType}
                  onViewTranscript={handleViewTranscript}
                  transcriptContent={transcriptContent}
                />
              ))}
              {painPoints.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No pain points found</p>
                </div>
              )}
            </div>
          </div>

          {/* Ideas/HMWs */}
          <div className="space-y-4">
            <div className="bg-yellow-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center justify-between">
              <span>{transcriptType === 'expert_interviews' ? 'IDEAS' : 'IDEAS/NEXT STEPS'}</span>
              <span className="bg-yellow-700 px-2 py-1 rounded text-xs">{ideasHmws.length}</span>
            </div>
            <div className="space-y-3">
              {ideasHmws.map((theme) => (
                <EnhancedThemeCard
                  key={theme.id}
                  theme={theme}
                  transcriptType={transcriptType}
                  onViewTranscript={handleViewTranscript}
                  transcriptContent={transcriptContent}
                />
              ))}
              {ideasHmws.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No ideas found</p>
                </div>
              )}
            </div>
          </div>

          {/* Generic */}
          {generic.length > 0 && (
            <div className="space-y-4">
              <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center justify-between">
                <span>GENERIC</span>
                <span className="bg-blue-700 px-2 py-1 rounded text-xs">{generic.length}</span>
              </div>
              <div className="space-y-3">
                {generic.map((theme) => (
                  <EnhancedThemeCard
                    key={theme.id}
                    theme={theme}
                    transcriptType={transcriptType}
                    onViewTranscript={handleViewTranscript}
                    transcriptContent={transcriptContent}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Transcript Modal */}
        {selectedQuote && (
          <TranscriptModal
            quote={selectedQuote}
            transcriptContent={transcriptContent}
            isOpen={showTranscriptModal}
            onOpenChange={setShowTranscriptModal}
          />
        )}
        
        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onOpenChange={setShowExportModal}
          transcriptType={transcriptType}
          sprintGoal={sprintGoal}
        />
        
        {/* Voting Modal */}
        <VotingModal
          isOpen={showVotingModal}
          onOpenChange={setShowVotingModal}
          projectId={1}
          onSessionCreated={(session) => {
            setActiveVotingSession(session);
            queryClient.invalidateQueries({ queryKey: ['/api/voting/sessions/1/active'] });
          }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-400 rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Sprint-thesiser</h1>
            </div>
          </div>
          
          {currentStep === 'insights' && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowVotingModal(true)}
                disabled={!!activeSession?.isActive}
              >
                <Vote className="w-4 h-4 mr-2" />
                {activeSession?.isActive ? 'Voting Active' : 'Start Voting'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setShowExportModal(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Panel - Sprint Context */}
          <div className="w-full lg:w-80 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Sprint goals</h3>
              <Textarea
                placeholder="What is your sprint trying to solve?"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="mb-3 min-h-[100px]"
              />
              <Button variant="outline" size="sm" onClick={addContextField}>
                <Plus className="w-4 h-4 mr-2" />
                Add context
              </Button>
              
              {/* Dynamic context fields */}
              {contextFields.map((field, index) => (
                <div key={index} className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-gray-700">Context</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeContextField(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Add additional context..."
                    value={field}
                    onChange={(e) => updateContextField(index, e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Transcript</h3>
                <Button variant="ghost" size="sm" className="p-1" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="w-4 h-4 text-gray-500" />
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".txt,.md,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              {/* Transcript type radio buttons */}
              <div className="mb-4">
                <RadioGroup value={transcriptType} onValueChange={(value) => setTranscriptType(value as 'expert_interviews' | 'testing_notes')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expert_interviews" id="expert" />
                    <Label htmlFor="expert" className="text-sm">Expert Interviews</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="testing_notes" id="testing" />
                    <Label htmlFor="testing" className="text-sm">Testing Notes</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Textarea
                placeholder="Paste your transcript here to extract insights"
                value={transcriptContent}
                onChange={(e) => setTranscriptContent(e.target.value)}
                className="min-h-[300px] mb-4"
              />
              <Button 
                onClick={handleSynthesize}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!transcriptContent.trim() || isAnalyzing}
              >
                {isAnalyzing ? 'ANALYZING...' : 'SYNTHESISE'}
              </Button>
            </div>
          </div>

          {/* Right Panel - Insights */}
          {currentStep === 'insights' ? (
            renderInsightCategories()
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center text-gray-500">
                <p className="text-base lg:text-lg mb-2">Ready to analyze your transcript</p>
                <p className="text-sm lg:text-base">Add your sprint context and paste transcript content to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}