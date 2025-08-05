import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Copy, Edit, Trash2, Quote as QuoteIcon, Brain, Heart, HeartHandshake } from "lucide-react";
import { Theme, Quote, VotingSession as VotingSessionType } from "@shared/schema";

interface EnhancedThemeCardProps {
  theme: Theme;
  transcriptType: 'expert_interviews' | 'testing_notes';
  onEditStep?: (themeId: number, stepIndex: number, newValue: string) => void;
  onDeleteStep?: (themeId: number, stepIndex: number) => void;
  onViewTranscript?: (quote: Quote) => void;
  transcriptContent?: string;
  activeVotingSession?: VotingSessionType | null;
  voteCounts?: { [key: string]: number };
  userVotes?: { [key: string]: boolean };
  onVote?: (themeId: number, itemType: string, itemIndex?: number) => void;
}

export function EnhancedThemeCard({ 
  theme, 
  transcriptType, 
  onEditStep, 
  onDeleteStep,
  onViewTranscript,
  transcriptContent = "",
  activeVotingSession,
  voteCounts = {},
  userVotes = {},
  onVote
}: EnhancedThemeCardProps) {
  const [editingStep, setEditingStep] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredStepIndex, setHoveredStepIndex] = useState<string | number | null>(null);

  const getCategoryConfig = () => {
    if (transcriptType === 'expert_interviews') {
      switch (theme.category) {
        case 'pain_points':
          return { color: 'bg-red-100 border-red-300', textColor: 'text-red-900' };
        case 'opportunities':
          return { color: 'bg-green-100 border-green-300', textColor: 'text-green-900' };
        case 'miscellaneous':
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

  const handleCopyStep = async (step: string) => {
    try {
      await navigator.clipboard.writeText(step);
      // Show temporary feedback in bottom right corner
      const toastEl = document.createElement('div');
      toastEl.textContent = 'Copied to clipboard!';
      toastEl.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-50 transition-opacity';
      document.body.appendChild(toastEl);
      setTimeout(() => {
        toastEl.style.opacity = '0';
        setTimeout(() => {
          if (document.body.contains(toastEl)) {
            document.body.removeChild(toastEl);
          }
        }, 300);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show error feedback in bottom right corner
      const toastEl = document.createElement('div');
      toastEl.textContent = 'Failed to copy';
      toastEl.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50';
      document.body.appendChild(toastEl);
      setTimeout(() => {
        if (document.body.contains(toastEl)) {
          document.body.removeChild(toastEl);
        }
      }, 2000);
    }
  };

  const handleEditStep = (index: number, isHmw: boolean = false) => {
    setEditingStep(index);
    if (isHmw) {
      setEditValue(theme.hmwQuestions?.[index] || "");
    } else {
      setEditValue(theme.aiSuggestedSteps?.[index] || "");
    }
  };

  const handleSaveEdit = (index: number, isHmw: boolean = false) => {
    if (onEditStep && editValue.trim()) {
      onEditStep(theme.id, index, editValue.trim());
    }
    setEditingStep(null);
    setEditValue("");
  };

  const handleDeleteStep = (index: number, isHmw: boolean = false) => {
    if (onDeleteStep) {
      onDeleteStep(theme.id, index);
    }
  };

  const getVoteKey = (itemType: string, itemIndex?: number) => {
    return `${theme.id}-${itemType}${itemIndex !== undefined ? `-${itemIndex}` : ''}`;
  };

  const getVoteCount = (itemType: string, itemIndex?: number) => {
    return voteCounts[getVoteKey(itemType, itemIndex)] || 0;
  };

  const hasUserVoted = (itemType: string, itemIndex?: number) => {
    return userVotes[getVoteKey(itemType, itemIndex)] || false;
  };

  const handleVote = (itemType: string, itemIndex?: number) => {
    if (onVote && activeVotingSession?.isActive) {
      onVote(theme.id, itemType, itemIndex);
    }
  };

  const VoteButton = ({ itemType, itemIndex }: { itemType: string; itemIndex?: number }) => {
    const voteCount = getVoteCount(itemType, itemIndex);
    const userVoted = hasUserVoted(itemType, itemIndex);
    
    // Show vote results even when session is inactive
    if (!activeVotingSession?.isActive) {
      // Only show if there are votes to display
      if (voteCount === 0) return null;
      
      return (
        <div className="flex items-center text-xs text-gray-600">
          <Heart className="w-3 h-3 mr-1 fill-current text-pink-500" />
          {voteCount}
        </div>
      );
    }
    
    // Interactive voting button during active session
    return (
      <Button
        variant="ghost"
        size="sm"
        className={`h-6 px-2 text-xs transition-colors ${
          userVoted 
            ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' 
            : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50'
        }`}
        onClick={() => handleVote(itemType, itemIndex)}
      >
        <Heart className={`w-3 h-3 mr-1 ${userVoted ? 'fill-current' : ''}`} />
        {voteCount > 0 && voteCount}
      </Button>
    );
  };

  return (
    <TooltipProvider>
      <Card 
        className={`${categoryConfig.color} p-4 hover:shadow-md transition-shadow relative`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Title */}
        <div className="flex items-center justify-between mb-3">
          <h4 className={`font-semibold ${categoryConfig.textColor}`}>
            {theme.title}
          </h4>
          <VoteButton itemType="theme" />
        </div>

        {/* Quotes */}
        <div className="space-y-2 mb-3">
          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <QuoteIcon className="w-4 h-4" />
            Quotes
          </h5>
          <div className="space-y-2">
            {theme.quotes?.slice(0, 2).map((quote, idx) => (
              <div 
                key={idx} 
                className="bg-gray-50 p-3 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onViewTranscript?.(quote)}
              >
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

        {/* AI Content - Show on hover or always during voting */}
        <div className="space-y-3">
            {/* Combined AI Suggestions */}
            {((theme.hmwQuestions && theme.hmwQuestions.length > 0) || (theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0)) && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  <Brain className="w-4 h-4" />
                  AI Suggestions
                </h5>
                
                {/* HMW Questions */}
                {theme.hmwQuestions && theme.hmwQuestions.length > 0 && (
                  <div className="space-y-2">
                    {theme.hmwQuestions.map((hmw, idx) => (
                      <div key={`hmw-${idx}`} className="space-y-1">
                        {editingStep === `hmw-${idx}` ? (
                          <div className="space-y-2">
                            <textarea
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(idx, true);
                                }
                                if (e.key === 'Escape') {
                                  setEditingStep(null);
                                  setEditValue("");
                                }
                              }}
                              placeholder="Enter your HMW question..."
                              autoFocus
                            />
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingStep(null);
                                  setEditValue("");
                                }}
                                className="h-7 px-3 py-1 text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleSaveEdit(idx, true)}
                                className="h-7 px-3 py-1 text-xs"
                              >
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-white/50 p-2 rounded">
                              <p className="text-sm text-gray-600 flex-1">
                                {hmw}
                              </p>
                            </div>
                            <div className="flex items-center justify-between bg-white/30 px-2 py-1 rounded text-xs">
                              <div className="flex items-center space-x-2">
                                {!activeVotingSession?.isActive && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCopyStep(hmw)}
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingStep(`hmw-${idx}`);
                                            setEditValue(hmw);
                                          }}
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit</TooltipContent>
                                    </Tooltip>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100 text-red-600"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete HMW Question</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this "How Might We" question? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteStep(idx, true)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                              <VoteButton itemType="hmw" itemIndex={idx} />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Suggested Steps */}
                {theme.aiSuggestedSteps && theme.aiSuggestedSteps.length > 0 && (
                  <div className="space-y-1">
                    {theme.aiSuggestedSteps.map((step, idx) => (
                      <div key={`step-${idx}`} className="group" onMouseEnter={() => setHoveredStepIndex(idx)} onMouseLeave={() => setHoveredStepIndex(null)}>
                        {editingStep === idx ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(idx);
                                if (e.key === 'Escape') {
                                  setEditingStep(null);
                                  setEditValue("");
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveEdit(idx)}
                              className="h-6 w-6 p-0"
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingStep(null);
                                setEditValue("");
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="bg-white/50 p-2 rounded">
                              <p className="text-sm text-gray-600 flex-1">
                                {step}
                              </p>
                            </div>
                            <div className="flex items-center justify-between bg-white/30 px-2 py-1 rounded text-xs">
                              <div className="flex items-center space-x-2">
                                {!activeVotingSession?.isActive && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleCopyStep(step)}
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                                        >
                                          <Copy className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Copy</TooltipContent>
                                    </Tooltip>
                                    
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setEditingStep(idx);
                                            setEditValue(step);
                                          }}
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100"
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Edit</TooltipContent>
                                    </Tooltip>
                                    
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-5 w-5 p-0 opacity-70 hover:opacity-100 text-red-600"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete AI Suggested Step</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this AI suggested step? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteStep(idx, false)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </>
                                )}
                              </div>
                              <VoteButton itemType="step" itemIndex={idx} />
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      </Card>
    </TooltipProvider>
  );
}