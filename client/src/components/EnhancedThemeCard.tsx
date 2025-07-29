import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Edit, Trash2, Quote as QuoteIcon, Brain } from "lucide-react";
import { Theme, Quote } from "@shared/schema";

interface EnhancedThemeCardProps {
  theme: Theme;
  transcriptType: 'expert_interviews' | 'testing_notes';
  onEditStep?: (themeId: number, stepIndex: number, newValue: string) => void;
  onDeleteStep?: (themeId: number, stepIndex: number) => void;
}

export function EnhancedThemeCard({ 
  theme, 
  transcriptType, 
  onEditStep, 
  onDeleteStep
}: EnhancedThemeCardProps) {
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);

  const getCategoryConfig = () => {
    if (transcriptType === 'expert_interviews') {
      switch (theme.category) {
        case 'pain_points':
          return { color: 'bg-red-100 border-red-300', textColor: 'text-red-900' };
        case 'opportunities':
          return { color: 'bg-green-100 border-green-300', textColor: 'text-green-900' };
        case 'ideas_hmws':
          return { color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-900' };
        default:
          return { color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-900' };
      }
    } else {
      switch (theme.category) {
        case 'pain_points':
          return { color: 'bg-red-100 border-red-300', textColor: 'text-red-900' };
        case 'opportunities':
          return { color: 'bg-green-100 border-green-300', textColor: 'text-green-900' };
        case 'ideas_hmws':
          return { color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-900' };
        default:
          return { color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-900' };
      }
    }
  };

  const categoryConfig = getCategoryConfig();

  const handleCopyStep = (step: string) => {
    navigator.clipboard.writeText(step);
  };

  const handleEditStep = (index: number) => {
    setEditingStep(index);
    setEditValue(theme.aiSuggestedSteps?.[index] || "");
  };

  const handleSaveEdit = (index: number) => {
    if (onEditStep && editValue.trim()) {
      onEditStep(theme.id, index, editValue.trim());
    }
    setEditingStep(null);
    setEditValue("");
  };

  const handleDeleteStep = (index: number) => {
    if (onDeleteStep) {
      onDeleteStep(theme.id, index);
    }
  };

  return (
    <TooltipProvider>
      <Card 
        className={`${categoryConfig.color} p-4 hover:shadow-md transition-shadow relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Title */}
        <h4 className={`font-semibold ${categoryConfig.textColor} mb-3`}>
          {theme.title}
        </h4>

        {/* Quotes */}
        <div className="space-y-2 mb-3">
          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <QuoteIcon className="w-4 h-4" />
            Quotes
          </h5>
          <div className="space-y-2">
            {theme.quotes?.slice(0, 2).map((quote, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                <p className="text-gray-700 line-clamp-2">"{quote.text}"</p>
                <p className="text-xs text-gray-500 mt-1">— {quote.source}</p>
              </div>
            ))}
            {(theme.quotes?.length || 0) > 2 && (
              <p className="text-xs text-gray-500 italic">
                +{(theme.quotes?.length || 0) - 2} more quotes
              </p>
            )}
          </div>
        </div>

        {/* AI Content - Only show on hover */}
        {isHovered && (
          <div className="space-y-3">
            {/* AI HMWs */}
            {theme.hmwQuestions && theme.hmwQuestions.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  HMWs
                </h5>
                <div className="space-y-1">
                  {theme.hmwQuestions.map((hmw, idx) => (
                    <p key={idx} className="text-sm text-gray-600 bg-white/50 p-2 rounded">
                      {hmw}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* AI Next Steps */}
            {theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  Next Steps
                </h5>
                <div className="space-y-2">
                  {theme.aiSuggestedSteps.map((step, idx) => (
                    <div key={idx} className="bg-blue-50 p-3 rounded border border-blue-200">
                      {editingStep === idx ? (
                        <div className="space-y-2">
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-full p-2 text-sm border rounded resize-none"
                            rows={2}
                          />
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleSaveEdit(idx)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingStep(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-blue-800 flex-1">{step}</p>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyStep(step)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Copy</TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleEditStep(idx)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete AI Suggestion</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this AI-suggested next step? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteStep(idx)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}