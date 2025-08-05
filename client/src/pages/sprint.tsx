import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Upload, Plus, Vote, Download, X, CheckSquare, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Project, Theme, Quote, VotingSession as VotingSessionType } from "@shared/schema";
import { TranscriptModal } from "@/components/TranscriptModal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { EnhancedThemeCard } from "@/components/EnhancedThemeCard";
import { SprintStatistics } from "@/components/SprintStatistics";
import { SprintFilters, FilterState } from "@/components/SprintFilters";
import { ExportModal } from "@/components/ExportModal";
import { VotingModal } from "@/components/VotingModal";
import { VotingSession } from "@/components/VotingSession";
import { AIPromptSettings } from "@/components/AIPromptSettings";

export default function SprintPage() {
  const [sprintGoal, setSprintGoal] = useState("");
  const [contextContent, setContextContent] = useState<string>("");
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
  const [voteCounts, setVoteCounts] = useState<{ [key: string]: number }>({});
  const [userVotes, setUserVotes] = useState<{ [key: string]: boolean }>({});
  const [voterToken, setVoterToken] = useState<string>('');
  const [showContext, setShowContext] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

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

  // Generate unique voter token on mount
  React.useEffect(() => {
    if (!voterToken) {
      setVoterToken(`voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
  }, []);

  // Update active session state when query data changes
  React.useEffect(() => {
    setActiveVotingSession(activeSession || null);
  }, [activeSession]);

  // Fetch vote counts when there's an active session or when session just ended
  React.useEffect(() => {
    if (activeSession?.id) {
      fetchVoteCounts(activeSession.id);
    }
  }, [activeSession?.id, activeSession?.isActive, themes]);

  const fetchVoteCounts = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/voting/votes/${sessionId}`);
      if (response.ok) {
        const votes: any[] = await response.json();
        
        // Calculate vote counts
        const counts: { [key: string]: number } = {};
        const userVoteMap: { [key: string]: boolean } = {};
        
        votes.forEach(vote => {
          const key = `${vote.themeId}-${vote.itemType}${vote.itemIndex !== null ? `-${vote.itemIndex}` : ''}`;
          counts[key] = (counts[key] || 0) + 1;
          
          // Track user's votes
          if (vote.voterToken === voterToken) {
            userVoteMap[key] = true;
          }
        });
        
        setVoteCounts(counts);
        setUserVotes(userVoteMap);
      }
    } catch (error) {
      console.error('Failed to fetch vote counts:', error);
    }
  };

  const handleVote = async (themeId: number, itemType: string, itemIndex?: number) => {
    if (!activeSession?.id || !voterToken) return;

    try {
      const voteKey = `${themeId}-${itemType}${itemIndex !== undefined ? `-${itemIndex}` : ''}`;
      const hasVoted = userVotes[voteKey];

      if (hasVoted) {
        // Remove vote
        const response = await fetch('/api/voting/vote', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSession.id,
            themeId,
            itemType,
            itemIndex,
            voterToken,
          }),
        });

        if (response.ok) {
          setVoteCounts(prev => ({
            ...prev,
            [voteKey]: Math.max(0, (prev[voteKey] || 0) - 1)
          }));
          setUserVotes(prev => ({
            ...prev,
            [voteKey]: false
          }));
        }
      } else {
        // Cast vote
        const response = await fetch('/api/voting/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: activeSession.id,
            themeId,
            itemType,
            itemIndex,
            voterToken,
          }),
        });

        if (response.ok) {
          setVoteCounts(prev => ({
            ...prev,
            [voteKey]: (prev[voteKey] || 0) + 1
          }));
          setUserVotes(prev => ({
            ...prev,
            [voteKey]: true
          }));
        }
      }
    } catch (error) {
      console.error('Voting error:', error);
    }
  };

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
    
    try {
      // Use real Claude AI analysis
      const response = await fetch('/api/sprint/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptContent,
          transcriptType,
          sprintGoal: sprintGoal || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Analysis failed');
      }

      const result = await response.json();
      
      toast({
        title: "Analysis Complete",
        description: `Found ${result.count} insights from your ${transcriptType === 'expert_interviews' ? 'expert interviews' : 'user testing notes'}`,
      });

      // Refresh themes display
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      setCurrentStep('insights');
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      toast({
        title: "Analysis failed",
        description: errorMessage.includes('API key') 
          ? "AI analysis requires an Anthropic API key. Please check your configuration."
          : `Analysis error: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };



  const handleViewTranscript = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowTranscriptModal(true);
  };

  const loadDemoData = () => {
    setSprintGoal("Identify pain points and product opportunities in seasonal hay fever management");
    setContextContent(`• Hayfever sufferers prefer a personalised way to interact with pollen allergy recommendations in natural languages and being specific to their context, activities

• Proactive alerts are essential on bad days where the conditions are heading towards a bad day (windy, extreme pollen count etc)

• Existing apps fail because they show generic data that doesn't correlate with personal symptoms. Users abandon apps when they can't see the connection between data and their experience`);
    
    const demoTranscript = `### Hay fever, allergy background

- Chronic hay fever and allergy sufferer, pretty much happening all year around
- Had skin test pin prick for different kinds of allergens at primary school: tested for pollen, grass, dust mites, etc and even did 'drops under the tongue' immunotherapy for a couple of months, but nothing really happened. Couldn't remember why they decided to stop the immunotherapy
- Essentially, 'how do you avoid grass and dust?'
- Things can get pretty bad in spring

### Hayfever management

- In the last 5 years, just have Telfast non-stop every day
- If stop taking it, can feel the difference: going outside and have itchy eyes.
- Also have post-nasal drip, have to do nasal rinse whenever feel clogged up or issues with sinuses
- Has sensitive sinuses, any changes in environment could set it off eg sitting near the door and has a whiff of cold air
- Cycling a lot, and in spring, if cycling on a windy day, with visible pollen it can be pretty noticeable
- Started wearing a mask when cycling before covid, but it could get annoying: too many things around the ears, helmets and masks.
- Subscribes to government air quality alerts, mainly about smokes, backburning.
- Tries to vacuum every week, as allergic to dust mites
- Thinking about getting an air purifier for the bedroom, as sometimes the air feels skanky when it's been raining a lot, or when it's too windy with pollen outside
- Has Nasonex, a cortisol nasal spray, hayfever relief and prevention, when feeling really bad in spring, but not using it much

### Reminders

- Trying to do anything daily is hard!'
- Using MediSafe, an app for daily reminder for Telfast medication but push notification is not enough
- Also has a bright smart light, shining to her face in the morning as a harsh reminder to take medications before turning it off

### Symptom correlations

- Used AirQuality App before but stopped using as it didn't really correlate to symptoms
- Had some bad days and looked at the app but all indicators were green
- Tried to look for specific items that might be different to correlate with symptoms, but couldn't find anything consistently correlated - gave up usage after a couple of months
- Message other people like her sister on 'bad days' or colleagues with hayfever, to check-in about their symptoms, to not feel crazy, to validate the issues, and try to find correlation or root causes`;

    setTranscriptContent(demoTranscript);
    setTranscriptType('expert_interviews');
    
    toast({
      title: "Demo Data Loaded",
      description: "Sprint goal, context, and transcript have been populated with hay fever management example",
    });
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
    const ideasHmws = filteredThemes.filter(t => t.category === 'miscellaneous');
    const generic = filteredThemes.filter(t => t.category === 'generic');

    // Calculate grid columns based on which categories have content
    const hasOpportunities = opportunities.length > 0;
    const hasPainPoints = painPoints.length > 0;
    const hasIdeasHmws = ideasHmws.length > 0;
    const hasGeneric = generic.length > 0;

    const activeColumns = [hasOpportunities, hasPainPoints, hasIdeasHmws, hasGeneric].filter(Boolean).length;
    const gridCols = activeColumns === 1 ? 'lg:grid-cols-1' : 
                     activeColumns === 2 ? 'lg:grid-cols-2' : 
                     'lg:grid-cols-3';

    return (
      <div className="flex-1 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-primary">SPRINT INSIGHTS</h2>
            <p className="text-sm lg:text-base text-gray-600">AI-powered synthesis assistant for Google Design Sprints.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-primary border-primary hover:bg-primary/5"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
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

        {/* Show results if session just ended and we have vote counts */}
        {(activeSession && !activeSession.isActive && Object.keys(voteCounts).length > 0) && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Voting Results Available</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Final Results
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVoteCounts({});
                    setUserVotes({});
                  }}
                  className="text-green-600 border-green-300"
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters - Show conditionally */}
        {showFilters && (
          <SprintFilters onFilterChange={handleFilterChange} transcriptType={transcriptType} />
        )}
        
        <div className={`grid grid-cols-1 ${gridCols} gap-6`} data-export-target="insights">
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
                  onEditStep={async (themeId, stepIndex, newValue) => {
                    try {
                      await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                        method: 'PATCH',
                        body: { newValue }
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                    } catch (error) {
                      console.error('Failed to edit HMW question:', error);
                    }
                  }}
                  onDeleteStep={async (themeId, stepIndex) => {
                    try {
                      await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                        method: 'DELETE'
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                    } catch (error) {
                      console.error('Failed to delete HMW question:', error);
                    }
                  }}
                  onViewTranscript={handleViewTranscript}
                  transcriptContent={transcriptContent}
                  activeVotingSession={activeVotingSession}
                  voteCounts={voteCounts}
                  userVotes={userVotes}
                  onVote={handleVote}
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
                  onEditStep={async (themeId, stepIndex, newValue) => {
                    try {
                      await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                        method: 'PATCH',
                        body: { newValue }
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                    } catch (error) {
                      console.error('Failed to edit HMW question:', error);
                    }
                  }}
                  onDeleteStep={async (themeId, stepIndex) => {
                    try {
                      await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                        method: 'DELETE'
                      });
                      queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                    } catch (error) {
                      console.error('Failed to delete HMW question:', error);
                    }
                  }}
                  onViewTranscript={handleViewTranscript}
                  transcriptContent={transcriptContent}
                  activeVotingSession={activeVotingSession}
                  voteCounts={voteCounts}
                  userVotes={userVotes}
                  onVote={handleVote}
                />
              ))}
              {painPoints.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">No pain points found</p>
                </div>
              )}
            </div>
          </div>

          {/* Ideas/HMWs - Only show if has content */}
          {hasIdeasHmws && (
            <div className="space-y-4">
              <div className="bg-yellow-600 text-white px-4 py-2 text-sm font-medium rounded flex items-center justify-between">
                <span>{transcriptType === 'expert_interviews' ? 'MISC/OBSERVATIONS' : 'IDEAS/NEXT STEPS'}</span>
                <span className="bg-yellow-700 px-2 py-1 rounded text-xs">{ideasHmws.length}</span>
              </div>
              <div className="space-y-3">
                {ideasHmws.map((theme) => (
                  <EnhancedThemeCard
                    key={theme.id}
                    theme={theme}
                    transcriptType={transcriptType}
                    onEditStep={async (themeId, stepIndex, newValue) => {
                      try {
                        await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                          method: 'PATCH',
                          body: { newValue }
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                      } catch (error) {
                        console.error('Failed to edit HMW question:', error);
                      }
                    }}
                    onDeleteStep={async (themeId, stepIndex) => {
                      try {
                        await apiRequest(`/api/themes/${themeId}/items/hmw/${stepIndex}`, {
                          method: 'DELETE'
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/themes'] });
                      } catch (error) {
                        console.error('Failed to delete HMW question:', error);
                      }
                    }}
                    onViewTranscript={handleViewTranscript}
                    transcriptContent={transcriptContent}
                    activeVotingSession={activeVotingSession}
                    voteCounts={voteCounts}
                    userVotes={userVotes}
                    onVote={handleVote}
                  />
                ))}
              </div>
            </div>
          )}

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
          voteCounts={voteCounts}
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
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center gradient-button">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-yellow-400 rounded-lg transform rotate-12"></div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-jakarta bg-gradient-to-r from-gray-900 to-purple-600 bg-clip-text text-transparent">
                Sprinthesiser
              </h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered Design Sprint synthesis</p>
            </div>
          </div>
          

          
          {currentStep === 'insights' && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button 
                size="sm" 
                className="w-full sm:w-auto gradient-button text-white font-medium rounded-xl"
                onClick={() => setShowVotingModal(true)}
                disabled={!!activeSession?.isActive}
              >
                <Vote className="w-4 h-4 mr-2" />
                {activeSession?.isActive ? 'Voting Active' : 'Start Voting'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto border-border text-gray-700 hover:text-gray-900 rounded-xl font-medium"
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
            {(currentStep === 'context' || currentStep === 'transcript') && (
              <Button
                onClick={loadDemoData}
                size="sm"
                className="flex items-center space-x-2 w-full gradient-button text-white font-medium rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Load Demo Data</span>
              </Button>
            )}
            
            <div className="gradient-card p-6 rounded-2xl">
              <h3 className="font-semibold text-primary mb-4 font-jakarta">Sprint Goals</h3>
              <Textarea
                placeholder="What is your sprint trying to solve?"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="mb-4 min-h-[100px] bg-white/60 border-border text-gray-900 placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-primary/50"
              />
              <div className="mt-4">
                {!showContext ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowContext(true)}
                    className="text-primary border-primary hover:bg-primary/5"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add context
                  </Button>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-primary mb-3 block font-jakarta">Context</Label>
                    <Textarea
                      placeholder="Add sprint hypotheses or context (use bullet points)..."
                      value={contextContent}
                      onChange={(e) => setContextContent(e.target.value)}
                      className="min-h-[120px] bg-white/60 border-border text-gray-900 placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="gradient-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary font-jakarta">Transcript</h3>
                <div className="flex items-center gap-2">
                  <AIPromptSettings transcriptType={transcriptType} />
                  <Button variant="ghost" size="sm" className="p-1" onClick={() => document.getElementById('file-upload')?.click()}>
                    <Upload className="w-4 h-4 text-gray-500" />
                  </Button>
                </div>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".txt,.md,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              
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
                className="min-h-[250px] mb-6 bg-white/60 border-border text-gray-900 placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-primary/50"
              />
              <Button 
                onClick={handleSynthesize}
                className="w-full gradient-button text-white font-semibold rounded-xl h-12 text-lg font-jakarta"
                disabled={!transcriptContent.trim() || isAnalyzing}
              >
                {isAnalyzing ? 'ANALYSING...' : 'SYNTHESISE'}
              </Button>
            </div>
          </div>

          {/* Right Panel - Insights */}
          {currentStep === 'insights' ? (
            renderInsightCategories()
          ) : (
            <div className="flex-1 flex flex-col p-6">
              <div className="text-center gradient-card p-8 rounded-3xl w-full mb-8">
                <p className="text-lg lg:text-xl mb-3 text-gray-900 font-jakarta font-medium">Ready to analyse your transcript</p>
                <p className="text-sm lg:text-base text-gray-600">Add your sprint context and paste transcript content to get started</p>
                <p className="text-xs text-gray-500 mt-4 font-jakarta">Your insights will be organised into visual categories like a real sprint wall</p>
              </div>
              
              <div className="flex-1 gradient-card p-8 rounded-3xl relative overflow-hidden">
                {/* Illustration of sprint insights wall */}
                <div className="relative h-full">
                  <div className="grid grid-cols-8 gap-4 h-full opacity-90">
                    {/* Opportunities Column */}
                    <div className="col-span-3 space-y-3 h-full">
                      <div className="h-8 bg-green-600 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-white font-bold text-lg" style={{fontFamily: 'Comic Neue, cursive'}}>Opportunities</span>
                      </div>
                      {Array.from({length: 7}, (_, i) => (
                        <div key={`opp-${i}`} 
                             className={`h-20 rounded-lg empty-state-card ${i % 2 ? 'rotate-1' : '-rotate-1'} ${
                               i === 0 ? 'bg-green-200' : 
                               i === 1 ? 'bg-lime-200' : 
                               i === 2 ? 'bg-green-300' :
                               i === 3 ? 'bg-emerald-200' :
                               i === 4 ? 'bg-green-100' :
                               i === 5 ? 'bg-lime-100' :
                               'bg-green-250'
                             } border border-green-300/30 shadow-sm`}
                             style={{'--rotation': `${i % 2 ? '1deg' : '-1deg'}`} as React.CSSProperties}>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pain Points Column */}
                    <div className="col-span-2 space-y-3 h-full">
                      <div className="h-8 bg-red-600 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-white font-bold text-lg" style={{fontFamily: 'Comic Neue, cursive'}}>Pain Points</span>
                      </div>
                      {Array.from({length: 5}, (_, i) => (
                        <div key={`pain-${i}`} 
                             className={`h-20 rounded-lg empty-state-card ${i % 2 ? '-rotate-2' : 'rotate-2'} ${
                               i === 0 ? 'bg-red-200' : 
                               i === 1 ? 'bg-pink-200' : 
                               i === 2 ? 'bg-red-100' :
                               i === 3 ? 'bg-rose-200' :
                               'bg-red-150'
                             } border border-red-300/30 shadow-sm`}
                             style={{'--rotation': `${i % 2 ? '-2deg' : '2deg'}`} as React.CSSProperties}>
                        </div>
                      ))}
                    </div>
                    
                    {/* Ideas/HMWs Column */}
                    <div className="col-span-3 space-y-3 h-full">
                      <div className="h-8 bg-yellow-600 rounded-xl mb-4 flex items-center justify-center">
                        <span className="text-white font-bold text-lg" style={{fontFamily: 'Comic Neue, cursive'}}>Ideas/HMWs</span>
                      </div>
                      {Array.from({length: 6}, (_, i) => (
                        <div key={`idea-${i}`} 
                             className={`h-20 rounded-lg empty-state-card ${i % 2 ? 'rotate-1' : '-rotate-1'} ${
                               i === 0 ? 'bg-yellow-200' : 
                               i === 1 ? 'bg-amber-200' : 
                               i === 2 ? 'bg-yellow-100' :
                               i === 3 ? 'bg-amber-100' :
                               i === 4 ? 'bg-yellow-300' :
                               'bg-yellow-150'
                             } border border-yellow-300/30 shadow-sm`}
                             style={{'--rotation': `${i % 2 ? '1deg' : '-1deg'}`} as React.CSSProperties}>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Floating elements for depth */}
                  <div className="absolute -top-2 left-8 w-8 h-8 bg-blue-200 rounded-lg transform rotate-12 opacity-60 shadow-sm border border-blue-300/30"></div>
                  <div className="absolute top-8 right-4 w-6 h-6 bg-purple-200 rounded-lg transform -rotate-6 opacity-70 shadow-sm border border-purple-300/30"></div>
                  <div className="absolute bottom-8 left-1/3 w-10 h-10 bg-orange-200 rounded-lg transform rotate-6 opacity-50 shadow-sm border border-orange-300/30"></div>
                </div>
                
                {/* Logo at bottom */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <div className="w-12 h-12 rounded-2xl gradient-button flex items-center justify-center">
                    <div className="w-6 h-6 bg-yellow-400 rounded-lg transform rotate-12"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}