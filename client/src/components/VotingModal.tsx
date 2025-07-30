import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Users, Share2, Play, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

interface VotingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSessionCreated: (session: any) => void;
}

export function VotingModal({ isOpen, onOpenChange, projectId, onSessionCreated }: VotingModalProps) {
  const [sessionName, setSessionName] = useState("");
  const [duration, setDuration] = useState("15");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Session name required",
        description: "Please enter a name for the voting session",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/voting/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          name: sessionName,
          duration: parseInt(duration),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create voting session');
      }

      const session = await response.json();

      toast({
        title: "Voting session created",
        description: `${sessionName} is ready to start!`,
      });

      onSessionCreated(session);
      onOpenChange(false);
      
      // Reset form
      setSessionName("");
      setDuration("15");
    } catch (error) {
      console.error('Create session error:', error);
      toast({
        title: "Failed to create session",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const durationOptions = [
    { value: "5", label: "5 minutes (Quick Vote)", description: "Fast decision making" },
    { value: "15", label: "15 minutes (Standard)", description: "Thoughtful consideration" },
    { value: "30", label: "30 minutes (Extended)", description: "Deep discussion" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Start New Voting Session
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="e.g., Sprint Review Vote"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p>• Team members vote anonymously on insights and suggestions</p>
              <p>• Real-time vote counts update automatically</p>
              <p>• Cards reorder by popularity during voting</p>
              <p>• All votes are cleared when session ends</p>
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSession} 
              disabled={isCreating || !sessionName.trim()}
              className="flex-1"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Create Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}