import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Share2, Square, CheckSquare, StopCircle } from "lucide-react";
import { VotingSession as VotingSessionType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
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
      await apiRequest(`/api/voting/sessions/${session.id}/end`, {
        method: 'POST',
      });

      toast({
        title: "Voting session ended",
        description: "All votes have been cleared. Results are now final.",
      });

      onSessionEnd();
    } catch (error) {
      toast({
        title: "Failed to end session",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  const copyVotingLink = () => {
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
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            {session.name}
          </CardTitle>
          <Badge className={`${getStatusColor()} text-white`}>
            {session.isActive ? 'Active' : 'Ended'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.isActive && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-mono text-lg font-bold text-blue-800">
                {formatTime(timeRemaining)}
              </span>
              <span className="text-sm text-blue-600">remaining</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyVotingLink}
              className="text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>
        )}

        <div className="text-sm text-gray-600 space-y-1">
          <p>• Team members can vote on any insight, quote, or AI suggestion</p>
          <p>• Cards automatically reorder by vote count in real-time</p>
          <p>• Anonymous voting ensures honest feedback</p>
          <p>• All votes are cleared when the session ends</p>
        </div>

        {session.isActive && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEnding}
              className="flex-1"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              {isEnding ? 'Ending...' : 'End Session'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}