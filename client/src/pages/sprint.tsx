import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Plus, Vote, Download } from "lucide-react";
import { Project, Theme } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function SprintPage() {
  const [sprintGoal, setSprintGoal] = useState("");
  const [transcriptContent, setTranscriptContent] = useState("");
  const [currentStep, setCurrentStep] = useState<'context' | 'transcript' | 'insights'>('context');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: project } = useQuery<Project>({
    queryKey: ["/api/project"],
  });

  const { data: themes = [], refetch: refetchThemes } = useQuery<Theme[]>({
    queryKey: ["/api/themes"],
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

  const handleSynthesize = async () => {
    if (!transcriptContent.trim()) return;
    
    setIsAnalyzing(true);
    synthesizeMutation.mutate({ 
      content: transcriptContent, 
      sprintGoal: sprintGoal 
    });
  };

  const renderInsightCategories = () => {
    const opportunities = themes.filter(t => t.category === 'opportunities');
    const painPoints = themes.filter(t => t.category === 'pain_points');
    const ideasHmws = themes.filter(t => t.category === 'ideas_hmws');

    return (
      <div className="flex-1 space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">SPRINT INSIGHTS</h2>
        <p className="text-gray-600">AI-powered synthesis assistant for Google Design Sprints.</p>
        
        <div className="grid grid-cols-3 gap-6">
          {/* Opportunities */}
          <div className="space-y-4">
            <div className="bg-black text-white px-4 py-2 text-sm font-medium rounded">
              OPPORTUNITIES
            </div>
            <div className="grid gap-3">
              {opportunities.length > 0 ? (
                opportunities.map((theme) => (
                  <Card key={theme.id} className="bg-green-200 border-green-300 p-4">
                    <h4 className="font-medium text-green-900">{theme.title}</h4>
                    {theme.hmwQuestions && theme.hmwQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {theme.hmwQuestions.map((hmw, idx) => (
                          <p key={idx} className="text-sm text-green-800">HMW: {hmw}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-green-200 border-green-300 h-20"></Card>
                ))
              )}
            </div>
          </div>

          {/* Pain Points */}
          <div className="space-y-4">
            <div className="bg-black text-white px-4 py-2 text-sm font-medium rounded">
              PAIN POINTS
            </div>
            <div className="grid gap-3">
              {painPoints.length > 0 ? (
                painPoints.map((theme) => (
                  <Card key={theme.id} className="bg-red-200 border-red-300 p-4">
                    <h4 className="font-medium text-red-900">{theme.title}</h4>
                    {theme.hmwQuestions && theme.hmwQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {theme.hmwQuestions.map((hmw, idx) => (
                          <p key={idx} className="text-sm text-red-800">HMW: {hmw}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-red-200 border-red-300 h-20"></Card>
                ))
              )}
            </div>
          </div>

          {/* Ideas/HMWs */}
          <div className="space-y-4">
            <div className="bg-black text-white px-4 py-2 text-sm font-medium rounded">
              IDEAS/HMWS
            </div>
            <div className="grid gap-3">
              {ideasHmws.length > 0 ? (
                ideasHmws.map((theme) => (
                  <Card key={theme.id} className="bg-yellow-200 border-yellow-300 p-4">
                    <h4 className="font-medium text-yellow-900">{theme.title}</h4>
                    {theme.hmwQuestions && theme.hmwQuestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {theme.hmwQuestions.map((hmw, idx) => (
                          <p key={idx} className="text-sm text-yellow-800">HMW: {hmw}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              ) : (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-yellow-200 border-yellow-300 h-20"></Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-8 h-8 bg-yellow-400 rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Sprint-thesiser</h1>
            </div>
          </div>
          
          {currentStep === 'insights' && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Vote className="w-4 h-4 mr-2" />
                Start Voting
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-8">
          {/* Left Panel - Sprint Context */}
          <div className="w-80 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Sprint goals</h3>
              <Input
                placeholder="What is your sprint trying to solve?"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                className="mb-3"
              />
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add context
              </Button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Transcript</h3>
                <Upload className="w-4 h-4 text-gray-500" />
              </div>
              <Textarea
                placeholder="Paste your transcript here to extract insights"
                value={transcriptContent}
                onChange={(e) => setTranscriptContent(e.target.value)}
                className="min-h-[200px] mb-4"
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
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Ready to analyze your transcript</p>
                <p>Add your sprint context and paste transcript content to get started</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}