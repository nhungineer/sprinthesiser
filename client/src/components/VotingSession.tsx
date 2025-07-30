import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Share2, Square, CheckSquare, StopCircle } from "lucide-react";
import { VotingSession as VotingSessionType } from "@shared/schema";

import { useToast } from "@/hooks/use-toast";

interface VotingSessionProps {
  session: VotingSessionType;
  onSessionEnd: () => void;
}

export function VotingSession({ session, onSessionEnd }: VotingSessionProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isEnding, setIsEnding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!session.isActive || !session.startsAt) return;

    const startTime = new Date(session.startsAt).getTime();
    const endTime = startTime + (session.duration * 60 * 1000);

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);

      if (remaining === 0 && session.isActive) {
        handleEndSession();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async () => {
    setIsEnding(true);
    try {
      const response = await fetch(`/api/voting/sessions/${session.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to end session');
      }

      toast({
        title: "Voting session ended",
        description: "All votes have been cleared. Results are now final.",
      });

      onSessionEnd();
    } catch (error) {
      console.error('End session error:', error);
      toast({
        title: "Failed to end session",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  const handleShareLink = () => {
    const votingUrl = `${window.location.origin}/vote/${session.id}`;
    navigator.clipboard.writeText(votingUrl);
    toast({
      title: "Link copied",
      description: "Share this link with your team to participate in voting",
    });
  };

  const getStatusColor = () => {
    if (!session.isActive) return "bg-gray-500";
    if (timeRemaining < 60000) return "bg-red-500"; // Less than 1 minute
    if (timeRemaining < 300000) return "bg-yellow-500"; // Less than 5 minutes
    return "bg-green-500";
  };

  return (
    <Card className="mb-6 bg-blue-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800">{session.name}</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Active
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-blue-800">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-sm text-blue-600">remaining</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleShareLink}
            >
              <Share2 className="w-4 h-4 mr-1" />
              Share Link
            </Button>
            
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleEndSession}
              disabled={isEnding}
            >
              {isEnding ? (
                <>
                  <Square className="w-4 h-4 mr-1 animate-spin" />
                  Ending...
                </>
              ) : (
                <>
                  <StopCircle className="w-4 h-4 mr-1" />
                  End Session
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}