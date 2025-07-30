import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Brain, Zap, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIPromptTemplate {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  description: string;
}

interface AIPromptSettingsProps {
  transcriptType: 'expert_interviews' | 'testing_notes';
  onTemplateChange?: (templateKey: string) => void;
}

export function AIPromptSettings({ transcriptType, onTemplateChange }: AIPromptSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<{ [key: string]: AIPromptTemplate }>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>(transcriptType);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sprint/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateIcon = (templateKey: string) => {
    switch (templateKey) {
      case 'expert_interviews': return <Users className="w-4 h-4" />;
      case 'testing_notes': return <FileText className="w-4 h-4" />;
      case 'general_research': return <Brain className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getTemplateColor = (templateKey: string) => {
    switch (templateKey) {
      case 'expert_interviews': return 'bg-blue-100 text-blue-800';
      case 'testing_notes': return 'bg-green-100 text-green-800';
      case 'general_research': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (onTemplateChange) {
      onTemplateChange(templateKey);
    }
  };

  const handleSaveCustomPrompt = () => {
    // In a real implementation, this would save to the backend
    toast({
      title: "Custom Prompt Saved",
      description: "Your custom AI prompt template has been saved for this session.",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          AI Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Prompt Templates
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Templates</h3>
            <div className="grid gap-3">
              {Object.entries(templates).map(([key, template]) => (
                <Card 
                  key={key} 
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === key ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:shadow-sm'
                  }`}
                  onClick={() => handleTemplateSelect(key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getTemplateIcon(key)}
                        {template.name}
                        {selectedTemplate === key && (
                          <Badge variant="default" className="ml-2">Active</Badge>
                        )}
                      </CardTitle>
                      <Badge className={getTemplateColor(key)}>
                        {key.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {selectedTemplate && templates[selectedTemplate] && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Template Details</h3>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {templates[selectedTemplate].name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      System Prompt
                    </label>
                    <Textarea 
                      value={templates[selectedTemplate].systemPrompt}
                      readOnly
                      className="min-h-[100px] text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      User Prompt Template
                    </label>
                    <Textarea 
                      value={templates[selectedTemplate].userPromptTemplate}
                      readOnly
                      className="min-h-[120px] text-sm bg-gray-50"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-3">Custom Prompt (Optional)</h3>
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Enter your custom analysis instructions here. This will override the selected template."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    Custom prompts let you tailor the AI analysis to your specific needs.
                  </p>
                  <Button 
                    onClick={handleSaveCustomPrompt}
                    disabled={!customPrompt.trim()}
                    size="sm"
                  >
                    Save Custom Prompt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">Current Configuration</h4>
                <p className="text-sm text-gray-600">
                  Using: {templates[selectedTemplate]?.name || 'Loading...'}
                </p>
              </div>
              <Button onClick={() => setIsOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}